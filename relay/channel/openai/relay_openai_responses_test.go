package openai

import (
	"fmt"
	"io"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/constant"
	"github.com/QuantumNous/new-api/dto"
	relaycommon "github.com/QuantumNous/new-api/relay/common"
	"github.com/QuantumNous/new-api/setting/operation_setting"
	relayconstant "github.com/QuantumNous/new-api/relay/constant"
	"github.com/QuantumNous/new-api/service/openaicompat"
	"github.com/QuantumNous/new-api/types"
	"github.com/gin-gonic/gin"
	"github.com/samber/lo"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func init() {
	gin.SetMode(gin.TestMode)
}

// TestResponsesToChatConversion_StreamPreserved verifies that the Responses→Chat
// conversion correctly preserves the stream flag.
func TestResponsesToChatConversion_StreamPreserved(t *testing.T) {
	t.Parallel()

	responsesReq := &dto.OpenAIResponsesRequest{
		Model:  "test-model",
		Input:  []byte(`"Say hello"`),
		Stream: lo.ToPtr(true),
	}

	chatReq, err := openaicompat.ResponsesRequestToChatCompletionsRequest(responsesReq)
	require.NoError(t, err)
	require.NotNil(t, chatReq)
	assert.NotNil(t, chatReq.Stream, "stream should be non-nil")
	assert.True(t, *chatReq.Stream, "stream should be true")

	// Verify JSON marshaling includes stream:true
	jsonData, err := common.Marshal(chatReq)
	require.NoError(t, err)
	assert.Contains(t, string(jsonData), `"stream":true`)
}

// TestResponsesToChatConversion_StreamFalse verifies stream=false is preserved.
func TestResponsesToChatConversion_StreamFalse(t *testing.T) {
	t.Parallel()

	responsesReq := &dto.OpenAIResponsesRequest{
		Model:  "test-model",
		Input:  []byte(`"Say hello"`),
		Stream: lo.ToPtr(false),
	}

	chatReq, err := openaicompat.ResponsesRequestToChatCompletionsRequest(responsesReq)
	require.NoError(t, err)
	require.NotNil(t, chatReq)
	assert.NotNil(t, chatReq.Stream)
	assert.False(t, *chatReq.Stream)
}

// TestResponsesToChatConversion_StreamOmitted verifies that omitting stream
// results in nil stream in the chat request.
func TestResponsesToChatConversion_StreamOmitted(t *testing.T) {
	t.Parallel()

	responsesReq := &dto.OpenAIResponsesRequest{
		Model: "test-model",
		Input: []byte(`"Say hello"`),
	}

	chatReq, err := openaicompat.ResponsesRequestToChatCompletionsRequest(responsesReq)
	require.NoError(t, err)
	assert.Nil(t, chatReq.Stream)
}

// buildSSEChunks returns a body with n SSE chunks + [DONE].
func buildSSEChunks(n int) string {
	var b strings.Builder
	for i := 0; i < n; i++ {
		fmt.Fprintf(&b, "data: {\"id\":\"chatcmpl-%d\",\"object\":\"chat.completion.chunk\",\"choices\":[{\"delta\":{\"content\":\"token%d\"},\"index\":0}]}\n\n", i, i)
	}
	b.WriteString("data: [DONE]\n")
	return b.String()
}

// setupStreamTestEnv sets up constants needed for streaming tests.
func setupStreamTestEnv(t *testing.T) {
	t.Helper()

	oldTimeout := constant.StreamingTimeout
	constant.StreamingTimeout = 30
	t.Cleanup(func() { constant.StreamingTimeout = oldTimeout })

	// Disable ping to avoid ticker panics with zero intervals
	gs := operation_setting.GetGeneralSetting()
	oldPing := gs.PingIntervalEnabled
	gs.PingIntervalEnabled = false
	t.Cleanup(func() { gs.PingIntervalEnabled = oldPing })
}

// TestOaiStreamHandler_StreamsDataToClient verifies that OaiStreamHandler
// properly reads SSE data from upstream and writes it to the client.
func TestOaiStreamHandler_StreamsDataToClient(t *testing.T) {
	t.Parallel()
	setupStreamTestEnv(t)

	const numChunks = 5
	body := buildSSEChunks(numChunks)
	recorder := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(recorder)
	c.Request = httptest.NewRequest(http.MethodPost, "/v1/chat/completions", nil)

	resp := &http.Response{
		Body: io.NopCloser(strings.NewReader(body)),
	}

	info := &relaycommon.RelayInfo{
		IsStream:    true,
		RelayMode:   relayconstant.RelayModeChatCompletions,
		RelayFormat: types.RelayFormatOpenAI,
		ChannelMeta: &relaycommon.ChannelMeta{
			UpstreamModelName: "test-model",
			ChannelSetting:    dto.ChannelSettings{},
		},
	}

	usage, newApiErr := OaiStreamHandler(c, info, resp)
	require.Nil(t, newApiErr)
	assert.NotNil(t, usage)

	output := recorder.Body.String()
	t.Logf("stream output (%d bytes): %s", len(output), output[:min(len(output), 300)])

	// Verify event-stream headers were set
	assert.Equal(t, "text/event-stream", recorder.Header().Get("Content-Type"))

	// Verify chunks are in the output
	for i := 0; i < numChunks; i++ {
		assert.Contains(t, output, fmt.Sprintf("token%d", i))
	}

	// Verify [DONE] was sent
	assert.Contains(t, output, "[DONE]")
}

// TestOaiStreamHandler_EmptyUpstream verifies handling when upstream returns no data.
func TestOaiStreamHandler_EmptyUpstream(t *testing.T) {
	t.Parallel()
	setupStreamTestEnv(t)

	body := "data: [DONE]\n"
	recorder := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(recorder)
	c.Request = httptest.NewRequest(http.MethodPost, "/v1/chat/completions", nil)

	resp := &http.Response{
		Body: io.NopCloser(strings.NewReader(body)),
	}

	info := &relaycommon.RelayInfo{
		IsStream:    true,
		RelayMode:   relayconstant.RelayModeChatCompletions,
		RelayFormat: types.RelayFormatOpenAI,
		ChannelMeta: &relaycommon.ChannelMeta{
			UpstreamModelName: "test-model",
			ChannelSetting:    dto.ChannelSettings{},
		},
	}

	usage, newApiErr := OaiStreamHandler(c, info, resp)
	require.Nil(t, newApiErr)
	assert.NotNil(t, usage)
	assert.Equal(t, "text/event-stream", recorder.Header().Get("Content-Type"))
}
