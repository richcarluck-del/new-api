package openaicompat

import (
	"encoding/base64"
	"encoding/json"
	"testing"

	"github.com/QuantumNous/new-api/dto"
	"github.com/stretchr/testify/assert"
)

func TestParseResponsesInput_DeveloperRoleMapping(t *testing.T) {
	t.Run("developer role mapped to system", func(t *testing.T) {
		input := json.RawMessage(`[{"role":"developer","content":"You are a helpful assistant"}]`)
		messages := parseResponsesInput(input)
		assert.Len(t, messages, 1)
		assert.Equal(t, "system", messages[0].Role)
		assert.Equal(t, "You are a helpful assistant", messages[0].Content)
	})

	t.Run("user role preserved", func(t *testing.T) {
		input := json.RawMessage(`[{"role":"user","content":"Hello"}]`)
		messages := parseResponsesInput(input)
		assert.Len(t, messages, 1)
		assert.Equal(t, "user", messages[0].Role)
	})

	t.Run("assistant role preserved", func(t *testing.T) {
		input := json.RawMessage(`[{"role":"assistant","content":"Hi there"}]`)
		messages := parseResponsesInput(input)
		assert.Len(t, messages, 1)
		assert.Equal(t, "assistant", messages[0].Role)
	})

	t.Run("system role preserved", func(t *testing.T) {
		input := json.RawMessage(`[{"role":"system","content":"System prompt"}]`)
		messages := parseResponsesInput(input)
		assert.Len(t, messages, 1)
		assert.Equal(t, "system", messages[0].Role)
	})

	t.Run("mixed roles with developer", func(t *testing.T) {
		input := json.RawMessage(`[
			{"role":"developer","content":"Dev instructions"},
			{"role":"user","content":"User message"}
		]`)
		messages := parseResponsesInput(input)
		assert.Len(t, messages, 2)
		assert.Equal(t, "system", messages[0].Role)
		assert.Equal(t, "Dev instructions", messages[0].Content)
		assert.Equal(t, "user", messages[1].Role)
		assert.Equal(t, "User message", messages[1].Content)
	})
}

func TestResponsesRequestToChatCompletions_ToolFiltering(t *testing.T) {
	t.Run("function tools pass through", func(t *testing.T) {
		req := &dto.OpenAIResponsesRequest{
			Model: "test-model",
			Input: json.RawMessage(`"hello"`),
			Tools: json.RawMessage(`[{"type":"function","name":"get_weather","description":"Get weather"}]`),
		}
		out, err := ResponsesRequestToChatCompletionsRequest(req)
		assert.NoError(t, err)
		assert.Len(t, out.Tools, 1)
		assert.Equal(t, "function", out.Tools[0].Type)
	})

	t.Run("namespace tools are filtered out", func(t *testing.T) {
		req := &dto.OpenAIResponsesRequest{
			Model: "test-model",
			Input: json.RawMessage(`"hello"`),
			Tools: json.RawMessage(`[{"type":"namespace","namespace":"mcp-server"}]`),
		}
		out, err := ResponsesRequestToChatCompletionsRequest(req)
		assert.NoError(t, err)
		assert.Len(t, out.Tools, 0)
	})

	t.Run("mixed tools filter non-function", func(t *testing.T) {
		req := &dto.OpenAIResponsesRequest{
			Model: "test-model",
			Input: json.RawMessage(`"hello"`),
			Tools: json.RawMessage(`[
				{"type":"function","name":"get_weather"},
				{"type":"namespace","namespace":"mcp-server"},
				{"type":"function","name":"search"}
			]`),
		}
		out, err := ResponsesRequestToChatCompletionsRequest(req)
		assert.NoError(t, err)
		assert.Len(t, out.Tools, 2)
		assert.Equal(t, "get_weather", out.Tools[0].Function.Name)
		assert.Equal(t, "search", out.Tools[1].Function.Name)
	})
}

func TestNormalizeParameters(t *testing.T) {
	t.Run("map object passes through", func(t *testing.T) {
		result := normalizeParameters(map[string]any{
			"type":       "object",
			"properties": map[string]any{"name": map[string]any{"type": "string"}},
		})
		assert.NotNil(t, result)
		m, ok := result.(map[string]any)
		assert.True(t, ok)
		assert.Equal(t, "object", m["type"])
	})

	t.Run("json string is parsed", func(t *testing.T) {
		result := normalizeParameters(`{"type":"object","properties":{"name":{"type":"string"}}}`)
		assert.NotNil(t, result)
		m, ok := result.(map[string]any)
		assert.True(t, ok)
		assert.Equal(t, "object", m["type"])
	})

	t.Run("base64 encoded json is decoded", func(t *testing.T) {
		schema := `{"type":"object","properties":{"cmd":{"type":"string"}},"required":["cmd"]}`
		encoded := base64.StdEncoding.EncodeToString([]byte(schema))
		result := normalizeParameters(encoded)
		assert.NotNil(t, result)
		m, ok := result.(map[string]any)
		assert.True(t, ok)
		assert.Contains(t, m, "required")
	})

	t.Run("invalid string returns nil", func(t *testing.T) {
		result := normalizeParameters("not-valid-json-or-base64!!!")
		assert.Nil(t, result)
	})
}

func TestResponsesRequestToChatCompletions_ToolParameters(t *testing.T) {
	t.Run("base64 encoded parameters are decoded", func(t *testing.T) {
		schema := `{"type":"object","properties":{"cmd":{"type":"string"}},"required":["cmd"]}`
		encoded := base64.StdEncoding.EncodeToString([]byte(schema))
		req := &dto.OpenAIResponsesRequest{
			Model: "test-model",
			Input: json.RawMessage(`"hello"`),
			Tools: json.RawMessage(`[{"type":"function","name":"exec_command","parameters":"` + encoded + `"}]`),
		}
		out, err := ResponsesRequestToChatCompletionsRequest(req)
		assert.NoError(t, err)
		assert.Len(t, out.Tools, 1)
		params, ok := out.Tools[0].Function.Parameters.(map[string]any)
		assert.True(t, ok)
		assert.Equal(t, "object", params["type"])
		assert.Contains(t, params, "required")
	})

	t.Run("plain json parameters pass through", func(t *testing.T) {
		req := &dto.OpenAIResponsesRequest{
			Model: "test-model",
			Input: json.RawMessage(`"hello"`),
			Tools: json.RawMessage(`[{"type":"function","name":"get_weather","parameters":{"type":"object","properties":{"city":{"type":"string"}}}}]`),
		}
		out, err := ResponsesRequestToChatCompletionsRequest(req)
		assert.NoError(t, err)
		assert.Len(t, out.Tools, 1)
		params, ok := out.Tools[0].Function.Parameters.(map[string]any)
		assert.True(t, ok)
		assert.Equal(t, "object", params["type"])
	})
}
