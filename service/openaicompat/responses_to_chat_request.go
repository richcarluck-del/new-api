package openaicompat

import (
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"strings"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/dto"
	"github.com/samber/lo"
)

// ResponsesRequestToChatCompletionsRequest converts an OpenAI Responses API
// request to a standard Chat Completions request so it can be forwarded to
// providers that only support the Chat Completions format.
func ResponsesRequestToChatCompletionsRequest(req *dto.OpenAIResponsesRequest) (*dto.GeneralOpenAIRequest, error) {
	if req == nil {
		return nil, errors.New("request is nil")
	}
	if req.Model == "" {
		return nil, errors.New("model is required")
	}

	messages := make([]dto.Message, 0)

	// Build system / developer message from Instructions.
	if len(req.Instructions) > 0 {
		var instructions string
		if err := common.Unmarshal(req.Instructions, &instructions); err == nil && strings.TrimSpace(instructions) != "" {
			messages = append(messages, dto.Message{
				Role:    "system",
				Content: strings.TrimSpace(instructions),
			})
		}
	}

	// Parse the input array preserving role information.
	messages = append(messages, parseResponsesInput(req.Input)...)

	// Text -> response_format.
	var responseFormat *dto.ResponseFormat
	if len(req.Text) > 0 {
		var textCfg map[string]any
		if err := common.Unmarshal(req.Text, &textCfg); err == nil {
			if fmt, ok := textCfg["format"].(map[string]any); ok {
				responseFormat = &dto.ResponseFormat{}
				if t, _ := fmt["type"].(string); t != "" {
					responseFormat.Type = t
				}
				if responseFormat.Type == "json_schema" {
					if schema, err := common.Marshal(fmt); err == nil {
						responseFormat.JsonSchema = schema
					}
				}
			}
		}
	}

	// Reasoning -> reasoning_effort.
	var reasoningEffort string
	if req.Reasoning != nil {
		reasoningEffort = req.Reasoning.Effort
	}

	// Tools - pass through.
	var tools []dto.ToolCallRequest
	if len(req.Tools) > 0 {
		var toolsList []map[string]any
		if err := common.Unmarshal(req.Tools, &toolsList); err == nil {
			for _, t := range toolsList {
				typ, _ := t["type"].(string)
				// Chat Completions only supports "function" type tools.
				// Skip non-function types (e.g. "namespace" for MCP tools).
				if typ != "" && typ != "function" {
					continue
				}
				tool := dto.ToolCallRequest{}
				if typ != "" {
					tool.Type = typ
				}
				// Chat Completions format: {type, function: {name, description, parameters}}
				if fn, ok := t["function"].(map[string]any); ok {
					if name, _ := fn["name"].(string); name != "" {
						tool.Function.Name = name
					}
					if desc, _ := fn["description"].(string); desc != "" {
						tool.Function.Description = desc
					}
					if params, ok := fn["parameters"]; ok {
						if b, err := common.Marshal(params); err == nil {
							tool.Function.Parameters = b
						}
					}
				}
				// Responses API flat format: {type, name, description, parameters}
				if tool.Function.Name == "" {
					if name, _ := t["name"].(string); name != "" {
						tool.Function.Name = name
					}
				}
				if tool.Function.Description == "" {
					if desc, _ := t["description"].(string); desc != "" {
						tool.Function.Description = desc
					}
				}
				if tool.Function.Parameters == nil {
					if params, ok := t["parameters"]; ok {
						tool.Function.Parameters = normalizeParameters(params)
					}
				}
				tools = append(tools, tool)
			}
		}
	}

	out := &dto.GeneralOpenAIRequest{
		Model:    req.Model,
		Messages: messages,
		Stream:   req.Stream,
	}

	if req.Temperature != nil {
		out.Temperature = req.Temperature
	}
	if req.TopP != nil {
		out.TopP = req.TopP
	}
	if req.MaxOutputTokens != nil {
		out.MaxTokens = req.MaxOutputTokens
	}
	if responseFormat != nil {
		out.ResponseFormat = responseFormat
	}
	if len(tools) > 0 {
		out.Tools = tools
	}
	if len(req.ToolChoice) > 0 {
		var tc any
		if err := common.Unmarshal(req.ToolChoice, &tc); err == nil {
			out.ToolChoice = tc
		}
	}
	if reasoningEffort != "" {
		out.ReasoningEffort = reasoningEffort
	}
	if req.User != nil {
		var userStr string
		if err := common.Unmarshal(req.User, &userStr); err == nil && userStr != "" {
			out.User, _ = common.Marshal(userStr)
		}
	}
	if req.ParallelToolCalls != nil {
		var ptc bool
		if err := common.Unmarshal(req.ParallelToolCalls, &ptc); err == nil {
			out.ParallelTooCalls = lo.ToPtr(ptc)
		}
	}
	if req.StreamOptions != nil {
		out.StreamOptions = req.StreamOptions
	}

	// DeepSeek models (deepseek-v4-pro, etc.) enable thinking mode by default
	// and require EVERY assistant message to carry the reasoning_content field,
	// even if empty. Codex never sends reasoning_content via the Responses API,
	// so we unconditionally inject an empty field on all assistant messages.
	for i := range out.Messages {
		if out.Messages[i].Role == "assistant" && out.Messages[i].ReasoningContent == nil {
			out.Messages[i].ReasoningContent = lo.ToPtr("")
		}
	}


	// DEBUG: print converted messages for tool call troubleshooting
	msgSummary := make([]map[string]interface{}, len(out.Messages))
	for i, m := range out.Messages {
		hasTC := m.ToolCalls != nil && len(m.ToolCalls) > 0
		hasRC := m.ReasoningContent != nil && *m.ReasoningContent != ""
		summary := map[string]interface{}{
			"idx":          i,
			"role":         m.Role,
			"hasToolCalls": hasTC,
			"hasReasoning": hasRC,
		}
		if m.ToolCallId != "" {
			summary["toolCallId"] = m.ToolCallId
		}
		msgSummary[i] = summary
	}
	b, _ := common.Marshal(msgSummary)
	println("DBG messages:", string(b))
	return out, nil
}

// responseInputItem mirrors the structure of an item in the Responses API
// `input` array. Both "id" and "call_id" are supported since different
// API versions / clients use different field names.
type responseInputItem struct {
	Type      string          `json:"type"`
	Role      string          `json:"role"`
	Content   json.RawMessage `json:"content"`
	ID        string          `json:"id"`
	CallID    string          `json:"call_id"`
	Name      string          `json:"name"`
	Arguments string          `json:"arguments"`
	Output    json.RawMessage `json:"output"`
	Status    string          `json:"status"`
}

// getCallID returns the call identifier, preferring call_id over id.
func (item *responseInputItem) getCallID() string {
	if item.CallID != "" {
		return item.CallID
	}
	return item.ID
}

// getOutputText extracts the text content from an output field that may be
// a plain string or a structured content array.
func (item *responseInputItem) getOutputText() string {
	if len(item.Output) == 0 {
		return ""
	}
	if common.GetJsonType(item.Output) == "string" {
		var s string
		if err := common.Unmarshal(item.Output, &s); err == nil {
			return s
		}
		return ""
	}
	// Try structured content array.
	var parts []responseContentPart
	if err := common.Unmarshal(item.Output, &parts); err != nil {
		return ""
	}
	// Join all text parts.
	var texts []string
	for _, p := range parts {
		t := p.Text
		if t == "" {
			t = p.Refusal
		}
		if t != "" {
			texts = append(texts, t)
		}
	}
	return strings.Join(texts, "\n")
}

// responseContentPart mirrors a single content part inside an input item's
// content array (input_text, input_image, input_file, output_text, refusal, etc.).
type responseContentPart struct {
	Type     string `json:"type"`
	Text     string `json:"text"`
	Refusal  string `json:"refusal"`
	ImageUrl any    `json:"image_url"`
	FileUrl  any    `json:"file_url"`
	VideoUrl any    `json:"video_url"`
}

func parseResponsesInput(input json.RawMessage) []dto.Message {
	if len(input) == 0 {
		return nil
	}

	// If the input is a plain string, treat it as a single user message.
	if common.GetJsonType(input) == "string" {
		var s string
		if err := common.Unmarshal(input, &s); err == nil && strings.TrimSpace(s) != "" {
			return []dto.Message{{Role: "user", Content: s}}
		}
		return nil
	}

	var items []responseInputItem
	if err := common.Unmarshal(input, &items); err != nil {
		return nil
	}

	messages := make([]dto.Message, 0, len(items))

	// flushToolCalls emits a single assistant message for buffered
	// function_call items. Consecutive function_call items represent
	// parallel tool calls and MUST be grouped into one message so that
	// the Chat Completions tool-call contract is satisfied.
	flushToolCalls := func(toolCalls []dto.ToolCallResponse) {
		if len(toolCalls) == 0 {
			return
		}
		toolCallsRaw, _ := common.Marshal(toolCalls)
		messages = append(messages, dto.Message{
			Role:      "assistant",
			Content:   nil,
			ToolCalls: toolCallsRaw,
		})
	}

	
	// DEBUG: log every input item to understand Codex's structure
	for i, item := range items {
		println(fmt.Sprintf("DBG input idx:%d type:%q role:%q callID:%q name:%q status:%q hasOutput:%v", i, item.Type, item.Role, item.getCallID(), item.Name, item.Status, len(item.Output) > 0))
	}

	var pendingToolCalls []dto.ToolCallResponse
	toolCallsJustFlushed := false
	for _, item := range items {
		itemType := strings.TrimSpace(item.Type)

		// Buffer consecutive function_call items so parallel calls stay
		// in a single assistant message.
		if itemType == "function_call" {
			callID := item.getCallID()
			if callID != "" {
				tc := dto.ToolCallResponse{
					ID:   callID,
					Type: "function",
					Function: dto.FunctionResponse{
						Name:      item.Name,
						Arguments: item.Arguments,
					},
				}
				pendingToolCalls = append(pendingToolCalls, tc)
			}
			continue
		}

		// Only flush pending tool calls right before a
		// function_call_output – never for messages of any role.
		// Flushing earlier (e.g. on an assistant or system message)
		// would insert that message between the assistant(tool_calls)
		// and its tool responses, breaking the Chat Completions
		// contract.
		if itemType == "function_call_output" {
			hadPending := len(pendingToolCalls) > 0
			flushToolCalls(pendingToolCalls)
			pendingToolCalls = nil
			toolCallsJustFlushed = hadPending
		} else {
			toolCallsJustFlushed = false
		}

		if itemType == "function_call_output" {
			toolCallsJustFlushed = false
			callID := item.getCallID()
			outputText := item.getOutputText()
			if callID != "" {
				messages = append(messages, dto.Message{
					Role:       "tool",
					Content:    outputText,
					ToolCallId: callID,
				})
			}
			continue
		}

		// Skip items that are not messages (e.g. item_reference, reasoning, etc.).
		if itemType != "" && itemType != "message" {
			toolCallsJustFlushed = false
			continue
		}

		role := strings.TrimSpace(item.Role)
		if role == "" {
			role = "user"
		}
		if role == "developer" {
			role = "system"
		}

		// Content can be a string or an array of content parts.
		if len(item.Content) == 0 {
			toolCallsJustFlushed = false
			continue
		}

		// If tool calls were just flushed and this message is from the
		// assistant, merge its content into the tool-calls message rather
		// than creating a separate assistant message. A separate message
		// would sit between the tool_calls message and the tool messages,
		// violating the Chat Completions contract.
		mergeIntoLast := toolCallsJustFlushed && role == "assistant"
		toolCallsJustFlushed = false

		contentType := common.GetJsonType(item.Content)
		if contentType == "string" {
			var s string
			if err := common.Unmarshal(item.Content, &s); err == nil {
				if mergeIntoLast {
					messages[len(messages)-1].Content = s
				} else {
					messages = append(messages, dto.Message{Role: role, Content: s})
				}
			}
			continue
		}

		// Content is an array of parts 鈥?parse each part.
		var parts []responseContentPart
		if err := common.Unmarshal(item.Content, &parts); err != nil {
			continue
		}

		if len(parts) == 1 && isSingleTextPart(parts[0]) {
			text := parts[0].Text
			if text == "" {
				text = parts[0].Refusal
			}
			if mergeIntoLast {
				messages[len(messages)-1].Content = text
			} else {
				messages = append(messages, dto.Message{Role: role, Content: text})
			}
			continue
		}

		// Multiple or non-text parts 鈥?build MediaContent array.
		contents := make([]dto.MediaContent, 0, len(parts))
		for _, part := range parts {
			mc := contentPartToMediaContent(part)
			// Skip parts that produced no valid content (unknown type with no text).
			if mc.Type == "" {
				continue
			}
			contents = append(contents, mc)
		}
		if len(contents) > 0 {
			if mergeIntoLast {
				messages[len(messages)-1].Content = contents
			} else {
				messages = append(messages, dto.Message{Role: role, Content: contents})
			}
		}
	}

	flushToolCalls(pendingToolCalls)
	return messages
}

func contentPartToMediaContent(part responseContentPart) dto.MediaContent {
	switch part.Type {
	case "input_text", "output_text":
		return dto.MediaContent{Type: dto.ContentTypeText, Text: part.Text}
	case "refusal":
		return dto.MediaContent{Type: dto.ContentTypeText, Text: part.Refusal}
	case "input_image":
		url := resolveNestedURL(part.ImageUrl)
		return dto.MediaContent{Type: dto.ContentTypeImageURL, ImageUrl: dto.MessageImageUrl{Url: url}}
	case "input_file":
		url := resolveNestedURL(part.FileUrl)
		return dto.MediaContent{Type: dto.ContentTypeFile, File: url}
	case "input_video":
		url := resolveNestedURL(part.VideoUrl)
		return dto.MediaContent{Type: dto.ContentTypeVideoUrl, VideoUrl: &dto.MessageVideoUrl{Url: url}}
	default:
		// Unknown type 鈥?try to use any available text content.
		text := part.Text
		if text == "" {
			text = part.Refusal
		}
		if text != "" {
			return dto.MediaContent{Type: dto.ContentTypeText, Text: text}
		}
		// No text content available; return zero-value MediaContent which
		// will be filtered out by the caller.
		return dto.MediaContent{}
	}
}

// isSingleTextPart returns true if a content part can be flattened to a single
// text string instead of building a MediaContent array.
func isSingleTextPart(part responseContentPart) bool {
	switch part.Type {
	case "input_text", "output_text", "refusal":
		return true
	default:
		return false
	}
}

// resolveNestedURL extracts a URL from a value that can be a plain string or an
// object with a "url" field (common in both Chat and Responses API formats).
func resolveNestedURL(v any) string {
	switch vv := v.(type) {
	case string:
		return vv
	case map[string]any:
		if url, ok := vv["url"].(string); ok {
			return url
		}
	}
	return ""
}

// normalizeParameters handles the tool parameters field which may arrive as:
// 1. A JSON object (map) 鈥?used as-is
// 2. A JSON-encoded string 鈥?parsed into an object
// 3. A base64-encoded JSON string 鈥?decoded then parsed
func normalizeParameters(params any) any {
	switch v := params.(type) {
	case map[string]any:
		return v
	case string:
		// Try direct JSON parse first.
		if b := []byte(v); json.Valid(b) && (b[0] == '{' || b[0] == '[') {
			var obj any
			if err := common.Unmarshal(b, &obj); err == nil {
				return obj
			}
		}
		// Try base64 decode.
		decoded, err := base64.StdEncoding.DecodeString(v)
		if err != nil {
			return nil
		}
		if json.Valid(decoded) {
			var obj any
			if err := common.Unmarshal(decoded, &obj); err == nil {
				return obj
			}
		}
	}
	return nil
}
