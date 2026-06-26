package openai

import (
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/dto"
	"github.com/QuantumNous/new-api/logger"
	relaycommon "github.com/QuantumNous/new-api/relay/common"
	"github.com/QuantumNous/new-api/relay/helper"
	"github.com/QuantumNous/new-api/service"
	"github.com/QuantumNous/new-api/types"

	"github.com/gin-gonic/gin"
)

// ChatStreamToResponsesStreamHandler converts a Chat Completions SSE stream from
// an upstream provider into Responses API SSE format and sends it to the client.
func ChatStreamToResponsesStreamHandler(c *gin.Context, info *relaycommon.RelayInfo, resp *http.Response) (*dto.Usage, *types.NewAPIError) {
	if resp == nil || resp.Body == nil {
		return nil, types.NewOpenAIError(fmt.Errorf("invalid response"), types.ErrorCodeBadResponse, http.StatusInternalServerError)
	}

	defer service.CloseResponseBodyGracefully(resp)

	responseId := helper.GetResponseID(c)
	createdAt := time.Now().Unix()
	model := info.UpstreamModelName
	usage := &dto.Usage{}

	var (
		outputTextBuilder   strings.Builder
		sentCreated         bool
		sentInProgress      bool
		sentOutputItemAdded bool
		sentOutputTextDone  bool
		sentContentPartDone bool
		sentOutputItemDone  bool
		sentCompleted       bool
		nextOutputIndex     int
		messageOutputIndex  int // captured when message item is created
		contentIndex        int
		messageItemID       string
		currentToolCallID   string
		currentToolCallIdx  int  // captured when function_call item is created
		toolCallName        string
		toolCallArgs        string
		streamErr           *types.NewAPIError
	)

	messageItemID = responseId + ":msg"

	// makeResponseEventJSON builds minimal JSON for response.* events.
	makeResponseEventJSON := func(eventType, status string, u *dto.Usage) string {
		respObj := map[string]interface{}{
			"id":         responseId,
			"object":     "response",
			"created_at": int(createdAt),
			"status":     status,
			"model":      model,
			"output":     []interface{}{},
		}
		if u != nil {
			respObj["usage"] = u
		}
		event := map[string]interface{}{
			"type":     eventType,
			"response": respObj,
		}
		b, err := common.Marshal(event)
		if err != nil {
			return ""
		}
		return string(b)
	}

	marshalEventData := func(evt dto.ResponsesStreamResponse) string {
		b, err := common.Marshal(evt)
		if err != nil {
			return ""
		}
		return string(b)
	}

	sendEvent := func(evt dto.ResponsesStreamResponse) bool {
		data := marshalEventData(evt)
		if data == "" {
			return true
		}
		helper.ResponseChunkData(c, evt, data)
		return true
	}

	sendResponseEvent := func(eventType, status string, u *dto.Usage) bool {
		data := makeResponseEventJSON(eventType, status, u)
		if data == "" {
			return true
		}
		helper.ResponseChunkData(c, dto.ResponsesStreamResponse{Type: eventType}, data)
		return true
	}

	sendCreatedIfNeeded := func() bool {
		if sentCreated {
			return true
		}
		if !sendResponseEvent("response.created", "in_progress", nil) {
			return false
		}
		sentCreated = true
		return true
	}

	sendInProgressIfNeeded := func() bool {
		if sentInProgress {
			return true
		}
		if !sendCreatedIfNeeded() {
			return false
		}
		if !sendResponseEvent("response.in_progress", "in_progress", nil) {
			return false
		}
		sentInProgress = true
		return true
	}

	sendOutputItemAddedIfNeeded := func() bool {
		if sentOutputItemAdded {
			return true
		}
		if !sendInProgressIfNeeded() {
			return false
		}
		idx := nextOutputIndex
		messageOutputIndex = idx
		nextOutputIndex++
		itemAddedEvt := dto.ResponsesStreamResponse{
			Type: "response.output_item.added",
			Item: &dto.ResponsesOutput{
				ID:      messageItemID,
				Type:    "message",
				Status:  "in_progress",
				Role:    "assistant",
				Content: []dto.ResponsesOutputContent{},
			},
			OutputIndex: &idx,
		}
		if !sendEvent(itemAddedEvt) {
			return false
		}
		partAddedEvt := dto.ResponsesStreamResponse{
			Type:         "response.content_part.added",
			ItemID:       messageItemID,
			OutputIndex:  &idx,
			ContentIndex: &contentIndex,
			Part: &dto.ResponsesReasoningSummaryPart{
				Type: "output_text",
			},
		}
		if !sendEvent(partAddedEvt) {
			return false
		}
		sentOutputItemAdded = true
		return true
	}

	sendOutputTextDone := func() {
		if sentOutputTextDone {
			return
		}
		sentOutputTextDone = true
		text := outputTextBuilder.String()
		msgIdx := messageOutputIndex
		contentIdx := contentIndex
		evt := dto.ResponsesStreamResponse{
			Type:         "response.output_text.done",
			ItemID:       messageItemID,
			OutputIndex:  &msgIdx,
			ContentIndex: &contentIdx,
			Delta:        text,
		}
		sendEvent(evt)
	}

	sendContentPartDone := func() {
		if sentContentPartDone {
			return
		}
		sentContentPartDone = true
		text := outputTextBuilder.String()
		msgIdx := messageOutputIndex
		contentIdx := contentIndex
		evt := dto.ResponsesStreamResponse{
			Type:         "response.content_part.done",
			ItemID:       messageItemID,
			OutputIndex:  &msgIdx,
			ContentIndex: &contentIdx,
			Part: &dto.ResponsesReasoningSummaryPart{
				Type: "output_text",
				Text: text,
			},
		}
		sendEvent(evt)
	}

	sendOutputItemDone := func() {
		if sentOutputItemDone {
			return
		}
		if !sentOutputItemAdded {
			return
		}
		sentOutputItemDone = true
		sendOutputTextDone()
		sendContentPartDone()
		text := outputTextBuilder.String()
		msgIdx := messageOutputIndex
		evt := dto.ResponsesStreamResponse{
			Type: "response.output_item.done",
			Item: &dto.ResponsesOutput{
				ID:     messageItemID,
				Type:   "message",
				Status: "completed",
				Role:   "assistant",
				Content: []dto.ResponsesOutputContent{
					{
						Type:        "output_text",
						Text:        text,
						Annotations: []interface{}{},
					},
				},
			},
			OutputIndex: &msgIdx,
		}
		sendEvent(evt)
	}

	sendCompleted := func() {
		if sentCompleted {
			return
		}
		sendOutputItemDone()
		if !sendInProgressIfNeeded() {
			return
		}
		sendResponseEvent("response.completed", "completed", usage)
		sentCompleted = true
	}

	sendToolCallDone := func() {
		if currentToolCallID == "" {
			return
		}
		tcIdx := currentToolCallIdx
			// Send function_call_arguments.done before output_item.done.
			if toolCallArgs != "" {
				argsDoneEvt := dto.ResponsesStreamResponse{
					Type:        "response.function_call_arguments.done",
					Arguments:   toolCallArgs,
					ItemID:      currentToolCallID,
					OutputIndex: &tcIdx,
				}
				sendEvent(argsDoneEvt)
			}
		item := &dto.ResponsesOutput{
			ID:     currentToolCallID,
			Type:   "function_call",
			Status: "completed",
			CallId: currentToolCallID,
			Name:   toolCallName,
		}
		if toolCallArgs != "" {
			item.Arguments, _ = common.Marshal(toolCallArgs)
		}
		evt := dto.ResponsesStreamResponse{
			Type:        "response.output_item.done",
			Item:        item,
			OutputIndex: &tcIdx,
		}
		sendEvent(evt)
	}

	helper.StreamScannerHandler(c, resp, info, func(data string, sr *helper.StreamResult) {
		if streamErr != nil {
			sr.Stop(streamErr)
			return
		}

		var chunk dto.ChatCompletionsStreamResponse
		if err := common.UnmarshalJsonStr(data, &chunk); err != nil {
			logger.LogError(c, "failed to unmarshal chat stream chunk: "+err.Error())
			sr.Error(err)
			return
		}

		if chunk.Id != "" {
			responseId = chunk.Id
		}
		if chunk.Created != 0 {
			createdAt = chunk.Created
		}
		if chunk.Model != "" {
			model = chunk.Model
		}

		if chunk.Usage != nil {
			if chunk.Usage.PromptTokens > 0 {
				usage.PromptTokens = chunk.Usage.PromptTokens
			}
			if chunk.Usage.CompletionTokens > 0 {
				usage.CompletionTokens = chunk.Usage.CompletionTokens
			}
			if chunk.Usage.TotalTokens > 0 {
				usage.TotalTokens = chunk.Usage.TotalTokens
			}
			usage.PromptTokensDetails = chunk.Usage.PromptTokensDetails
			usage.CompletionTokenDetails = chunk.Usage.CompletionTokenDetails
			usage.InputTokens = chunk.Usage.InputTokens
			usage.OutputTokens = chunk.Usage.OutputTokens
			usage.InputTokensDetails = chunk.Usage.InputTokensDetails
		}

		if len(chunk.Choices) == 0 {
			return
		}
		choice := chunk.Choices[0]

		// Content delta -> response.output_text.delta
		if choice.Delta.Content != nil && *choice.Delta.Content != "" {
			if !sendOutputItemAddedIfNeeded() {
				return
			}
			delta := *choice.Delta.Content
			outputTextBuilder.WriteString(delta)
			msgIdx := messageOutputIndex
			evt := dto.ResponsesStreamResponse{
				Type:         "response.output_text.delta",
				Delta:        delta,
				ItemID:       messageItemID,
				OutputIndex:  &msgIdx,
				ContentIndex: &contentIndex,
			}
			if !sendEvent(evt) {
				return
			}
		}

		// Reasoning content delta -> response.reasoning_summary_text.delta
		if choice.Delta.ReasoningContent != nil && *choice.Delta.ReasoningContent != "" {
			if !sendInProgressIfNeeded() {
				return
			}
			delta := *choice.Delta.ReasoningContent
			evt := dto.ResponsesStreamResponse{
				Type:  "response.reasoning_summary_text.delta",
				Delta: delta,
			}
			if !sendEvent(evt) {
				return
			}
		}

		// Tool calls -> response.output_item.added + response.function_call_arguments.delta
		if len(choice.Delta.ToolCalls) > 0 {
			if !sendInProgressIfNeeded() {
				return
			}
			for _, tc := range choice.Delta.ToolCalls {
				if tc.ID != "" && tc.ID != currentToolCallID {
					if currentToolCallID != "" {
						sendToolCallDone()
					}
					currentToolCallID = tc.ID
					currentToolCallIdx = nextOutputIndex
					nextOutputIndex++
					toolCallName = ""
					toolCallArgs = ""
				}

				if tc.Function.Name != "" && toolCallName == "" {
					toolCallName = tc.Function.Name
					itemId := currentToolCallID
					if itemId == "" {
						itemId = fmt.Sprintf("%s:fc:%d", responseId, currentToolCallIdx)
						currentToolCallID = itemId
					}
					tcIdx := currentToolCallIdx
					evt := dto.ResponsesStreamResponse{
						Type: "response.output_item.added",
						Item: &dto.ResponsesOutput{
							Type:   "function_call",
							ID:     itemId,
							Status: "in_progress",
							CallId: currentToolCallID,
							Name:   toolCallName,
						},
						OutputIndex: &tcIdx,
					}
					if !sendEvent(evt) {
						return
					}
				}

				if tc.Function.Arguments != "" {
					newArgs := tc.Function.Arguments
					var argsDelta string
					if strings.HasPrefix(newArgs, toolCallArgs) && len(newArgs) >= len(toolCallArgs) {
						argsDelta = newArgs[len(toolCallArgs):]
					} else {
						argsDelta = newArgs
					}
					toolCallArgs = toolCallArgs + argsDelta
					if argsDelta == "" {
						continue
					}
					tcIdx := currentToolCallIdx
					evt := dto.ResponsesStreamResponse{
						Type:        "response.function_call_arguments.delta",
						Delta:       argsDelta,
						ItemID:      currentToolCallID,
						OutputIndex: &tcIdx,
					}
					if !sendEvent(evt) {
						return
					}
				}
			}
		}

		// Finish reason -> send output_item.done (if tool call) + response.completed
		if choice.FinishReason != nil && *choice.FinishReason != "" {
			if currentToolCallID != "" {
				sendToolCallDone()
			}
			sendCompleted()
			sr.Stop(nil)
			return
		}
	})

	if streamErr != nil {
		return nil, streamErr
	}

	if usage.TotalTokens == 0 {
		usage = service.ResponseText2Usage(c, outputTextBuilder.String(), info.UpstreamModelName, info.GetEstimatePromptTokens())
	}

	if !sentCompleted {
		sendCompleted()
	}

	return usage, nil
}
