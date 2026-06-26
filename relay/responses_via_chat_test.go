package relay

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/QuantumNous/new-api/constant"
	"github.com/QuantumNous/new-api/dto"
	"github.com/QuantumNous/new-api/relay/channel/deepseek"
	relaycommon "github.com/QuantumNous/new-api/relay/common"
	relayconstant "github.com/QuantumNous/new-api/relay/constant"
	"github.com/QuantumNous/new-api/service"
	"github.com/QuantumNous/new-api/setting/operation_setting"
	"github.com/QuantumNous/new-api/types"
	"github.com/gin-gonic/gin"
	"github.com/samber/lo"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func init() {
	gin.SetMode(gin.TestMode)
}

func setupResponsesTestEnv(t *testing.T) {
	t.Helper()

	oldTimeout := constant.StreamingTimeout
	constant.StreamingTimeout = 30
	t.Cleanup(func() { constant.StreamingTimeout = oldTimeout })

	service.InitHttpClient()

	gs := operation_setting.GetGeneralSetting()
	oldPing := gs.PingIntervalEnabled
	gs.PingIntervalEnabled = false
	t.Cleanup(func() { gs.PingIntervalEnabled = oldPing })
}

func makeChannelMeta(baseUrl, upstreamModel string) *relaycommon.ChannelMeta {
	return &relaycommon.ChannelMeta{
		ChannelType:       constant.ChannelTypeDeepSeek,
		ChannelBaseUrl:    baseUrl,
		ApiType:           constant.APITypeDeepSeek,
		ApiKey:            "test-key",
		UpstreamModelName: upstreamModel,
		ChannelSetting:    dto.ChannelSettings{},
	}
}

// TestResponsesViaChatCompletions_NonStreaming tests the non-streaming path.
func TestResponsesViaChatCompletions_NonStreaming(t *testing.T) {
	t.Parallel()
	setupResponsesTestEnv(t)

	upstream := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		assert.Equal(t, "/v1/chat/completions", r.URL.Path)
		assert.Equal(t, "POST", r.Method)

		body, _ := io.ReadAll(r.Body)
		var req dto.GeneralOpenAIRequest
		require.NoError(t, json.Unmarshal(body, &req))
		assert.Nil(t, req.Stream)

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(map[string]interface{}{
			"id":      "chatcmpl-test",
			"object":  "chat.completion",
			"model":   "test-model",
			"choices": []map[string]interface{}{{"index": 0, "message": map[string]string{"role": "assistant", "content": "Hello"}}},
			"usage":   map[string]int{"prompt_tokens": 5, "completion_tokens": 1, "total_tokens": 6},
		})
	}))
	defer upstream.Close()

	recorder := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(recorder)
	c.Request = httptest.NewRequest(http.MethodPost, "/v1/responses", strings.NewReader(`{"model":"test","input":"hello"}`))
	c.Request.Header.Set("Content-Type", "application/json")

	info := &relaycommon.RelayInfo{
		IsStream:       false,
		RelayMode:      relayconstant.RelayModeResponses,
		RelayFormat:    types.RelayFormatOpenAIResponses,
		OriginModelName: "test-model",
		ChannelMeta:    makeChannelMeta(upstream.URL, "test-model"),
	}

	adaptor := &deepseek.Adaptor{}
	adaptor.Init(info)

	responsesReq := &dto.OpenAIResponsesRequest{
		Model: "test-model",
		Input: json.RawMessage(`"hello"`),
	}

	usage, apiErr := responsesViaChatCompletions(c, info, adaptor, responsesReq)
	require.Nil(t, apiErr)
	assert.NotNil(t, usage)
	assert.Equal(t, 6, usage.TotalTokens)
	assert.Equal(t, 1, usage.CompletionTokens)

	output := recorder.Body.String()
	assert.Contains(t, output, "chat.completion")
	assert.Contains(t, output, "Hello")
}

// TestResponsesViaChatCompletions_Streaming tests the streaming path end-to-end.
func TestResponsesViaChatCompletions_Streaming(t *testing.T) {
	t.Parallel()
	setupResponsesTestEnv(t)

	const numChunks = 5
	upstream := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		assert.Equal(t, "/v1/chat/completions", r.URL.Path)

		body, _ := io.ReadAll(r.Body)
		var req dto.GeneralOpenAIRequest
		require.NoError(t, json.Unmarshal(body, &req))
		assert.NotNil(t, req.Stream)
		assert.True(t, *req.Stream)

		w.Header().Set("Content-Type", "text/event-stream")
		flusher, ok := w.(http.Flusher)
		if !ok {
			t.Fatal("expected http.Flusher")
		}
		for i := 0; i < numChunks; i++ {
			fmt.Fprintf(w, "data: {\"id\":\"chatcmpl-%d\",\"object\":\"chat.completion.chunk\",\"choices\":[{\"delta\":{\"content\":\"token%d\"},\"index\":0}]}\n\n", i, i)
			flusher.Flush()
		}
		fmt.Fprintf(w, "data: {\"id\":\"chatcmpl-last\",\"object\":\"chat.completion.chunk\",\"choices\":[{\"delta\":{},\"index\":0}],\"usage\":{\"prompt_tokens\":10,\"completion_tokens\":%d,\"total_tokens\":%d}}\n\n", numChunks, 10+numChunks)
		flusher.Flush()
		fmt.Fprintf(w, "data: [DONE]\n")
		flusher.Flush()
	}))
	defer upstream.Close()

	recorder := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(recorder)
	c.Request = httptest.NewRequest(http.MethodPost, "/v1/responses", strings.NewReader(`{"model":"test","input":"hello","stream":true}`))
	c.Request.Header.Set("Content-Type", "application/json")

	info := &relaycommon.RelayInfo{
		IsStream:       true,
		RelayMode:      relayconstant.RelayModeResponses,
		RelayFormat:    types.RelayFormatOpenAIResponses,
		OriginModelName: "test-model",
		ChannelMeta:    makeChannelMeta(upstream.URL, "test-model"),
	}

	adaptor := &deepseek.Adaptor{}
	adaptor.Init(info)

	responsesReq := &dto.OpenAIResponsesRequest{
		Model:  "test-model",
		Input:  json.RawMessage(`"hello"`),
		Stream: lo.ToPtr(true),
	}

	usage, apiErr := responsesViaChatCompletions(c, info, adaptor, responsesReq)
	require.Nil(t, apiErr)
	assert.NotNil(t, usage)

	output := recorder.Body.String()
	t.Logf("streaming output (%d bytes): %s", len(output), output[:min(len(output), 400)])

	assert.Equal(t, "text/event-stream", recorder.Header().Get("Content-Type"))

	for i := 0; i < numChunks; i++ {
		assert.Contains(t, output, fmt.Sprintf("token%d", i))
	}
	// Responses API format: no [DONE]; uses response.completed instead.
	assert.Contains(t, output, "response.created")
	assert.Contains(t, output, "response.output_text.delta")
	assert.Contains(t, output, "response.completed")
	assert.NotContains(t, output, "[DONE]")
}

// TestResponsesViaChatCompletions_DeepSeekModelMapping checks that
// the model name and stream flag are preserved through streaming.
func TestResponsesViaChatCompletions_DeepSeekModelMapping(t *testing.T) {
	t.Parallel()
	setupResponsesTestEnv(t)

	upstream := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		assert.Equal(t, "/v1/chat/completions", r.URL.Path)

		body, _ := io.ReadAll(r.Body)
		var req dto.GeneralOpenAIRequest
		require.NoError(t, json.Unmarshal(body, &req))
		assert.Equal(t, "deepseek-v4-flash", req.Model)

		w.Header().Set("Content-Type", "text/event-stream")
		flusher := w.(http.Flusher)
		fmt.Fprintf(w, "data: {\"id\":\"chatcmpl-0\",\"object\":\"chat.completion.chunk\",\"choices\":[{\"delta\":{\"content\":\"Hi\"},\"index\":0}],\"model\":\"deepseek-v4-flash\"}\n\n")
		flusher.Flush()
		fmt.Fprintf(w, "data: [DONE]\n")
		flusher.Flush()
	}))
	defer upstream.Close()

	recorder := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(recorder)
	c.Request = httptest.NewRequest(http.MethodPost, "/v1/responses", strings.NewReader(`{"model":"deepseek-v4-flash","input":"Say hello","stream":true}`))
	c.Request.Header.Set("Content-Type", "application/json")

	info := &relaycommon.RelayInfo{
		IsStream:       true,
		RelayMode:      relayconstant.RelayModeResponses,
		RelayFormat:    types.RelayFormatOpenAIResponses,
		OriginModelName: "deepseek-v4-flash",
		ChannelMeta:    makeChannelMeta(upstream.URL, "deepseek-v4-flash"),
	}

	adaptor := &deepseek.Adaptor{}
	adaptor.Init(info)

	responsesReq := &dto.OpenAIResponsesRequest{
		Model:  "deepseek-v4-flash",
		Input:  json.RawMessage(`"Say hello"`),
		Stream: lo.ToPtr(true),
	}

	usage, apiErr := responsesViaChatCompletions(c, info, adaptor, responsesReq)
	require.Nil(t, apiErr)
	assert.NotNil(t, usage)
	assert.Contains(t, recorder.Body.String(), "Hi")
	assert.Contains(t, recorder.Body.String(), "response.completed")
	assert.NotContains(t, recorder.Body.String(), "[DONE]")
}

// TestResponsesViaChatCompletions_UpstreamError tests error propagation.
func TestResponsesViaChatCompletions_UpstreamError(t *testing.T) {
	t.Parallel()
	setupResponsesTestEnv(t)

	upstream := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusInternalServerError)
		w.Write([]byte(`{"error":{"message":"internal error","type":"server_error"}}`))
	}))
	defer upstream.Close()

	recorder := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(recorder)
	c.Request = httptest.NewRequest(http.MethodPost, "/v1/responses", strings.NewReader(`{"model":"test","input":"hello"}`))
	c.Request.Header.Set("Content-Type", "application/json")

	info := &relaycommon.RelayInfo{
		IsStream:       false,
		RelayMode:      relayconstant.RelayModeResponses,
		RelayFormat:    types.RelayFormatOpenAIResponses,
		OriginModelName: "test-model",
		ChannelMeta:    makeChannelMeta(upstream.URL, "test-model"),
	}

	adaptor := &deepseek.Adaptor{}
	adaptor.Init(info)

	responsesReq := &dto.OpenAIResponsesRequest{
		Model: "test-model",
		Input: json.RawMessage(`"hello"`),
	}

	usage, apiErr := responsesViaChatCompletions(c, info, adaptor, responsesReq)
	assert.Nil(t, usage)
	assert.NotNil(t, apiErr)
}
