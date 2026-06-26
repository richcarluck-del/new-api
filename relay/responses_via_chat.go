package relay

import (
	"bytes"
	"net/http"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/dto"
	"github.com/QuantumNous/new-api/relay/channel"
	openaichannel "github.com/QuantumNous/new-api/relay/channel/openai"
	relaycommon "github.com/QuantumNous/new-api/relay/common"
	relayconstant "github.com/QuantumNous/new-api/relay/constant"
	"github.com/QuantumNous/new-api/relay/helper"
	"github.com/QuantumNous/new-api/service"
	"github.com/QuantumNous/new-api/types"

	"github.com/gin-gonic/gin"
)

// responsesViaChatCompletions handles a Responses API request by converting it
// to Chat Completions format. This is the fallback path for adaptors that do
// not natively implement ConvertOpenAIResponsesRequest.
func responsesViaChatCompletions(
	c *gin.Context,
	info *relaycommon.RelayInfo,
	adaptor channel.Adaptor,
	responsesReq *dto.OpenAIResponsesRequest,
) (*dto.Usage, *types.NewAPIError) {
	// 1. Convert Responses request -> Chat Completions request.
	chatReq, err := service.ResponsesRequestToChatCompletionsRequest(responsesReq)
	if err != nil {
		return nil, types.NewErrorWithStatusCode(err, types.ErrorCodeInvalidRequest, http.StatusBadRequest, types.ErrOptionWithSkipRetry())
	}

	// 2. Deep copy for model mapping and overrides.
	request, err := common.DeepCopy(chatReq)
	if err != nil {
		return nil, types.NewError(err, types.ErrorCodeInvalidRequest, types.ErrOptionWithSkipRetry())
	}

	err = helper.ModelMappedHelper(c, info, request)
	if err != nil {
		return nil, types.NewError(err, types.ErrorCodeChannelModelMappedError, types.ErrOptionWithSkipRetry())
	}

	info.AppendRequestConversion(types.RelayFormatOpenAI)

	// 3. Save original relay mode/format and switch to Chat Completions so
	//    DoResponse handles the upstream response in Chat format.
	savedRelayMode := info.RelayMode
	savedRelayFormat := info.RelayFormat
	savedIncludeUsage := info.ShouldIncludeUsage
	defer func() {
		info.RelayMode = savedRelayMode
		info.RelayFormat = savedRelayFormat
		info.ShouldIncludeUsage = savedIncludeUsage
	}()

	info.RelayMode = relayconstant.RelayModeChatCompletions
	info.RelayFormat = types.RelayFormatOpenAI
	if request.StreamOptions != nil {
		info.ShouldIncludeUsage = request.StreamOptions.IncludeUsage
	}

	// 4. Convert request via adaptor (Chat Completions path).
	convertedRequest, err := adaptor.ConvertOpenAIRequest(c, info, request)
	if err != nil {
		return nil, types.NewError(err, types.ErrorCodeConvertRequestFailed, types.ErrOptionWithSkipRetry())
	}
	relaycommon.AppendRequestConversionFromRequest(info, convertedRequest)

	jsonData, err := common.Marshal(convertedRequest)
	if err != nil {
		return nil, types.NewError(err, types.ErrorCodeJsonMarshalFailed, types.ErrOptionWithSkipRetry())
	}

	// Remove disabled fields.
	jsonData, err = relaycommon.RemoveDisabledFields(jsonData, info.ChannelOtherSettings, info.ChannelSetting.PassThroughBodyEnabled)
	if err != nil {
		return nil, types.NewError(err, types.ErrorCodeConvertRequestFailed, types.ErrOptionWithSkipRetry())
	}

	// Apply param override.
	if len(info.ParamOverride) > 0 {
		jsonData, err = relaycommon.ApplyParamOverrideWithRelayInfo(jsonData, info)
		if err != nil {
			return nil, newAPIErrorFromParamOverride(err)
		}
	}

	// 5. Send request to upstream.
	requestBody := bytes.NewBuffer(jsonData)

	resp, err := adaptor.DoRequest(c, info, requestBody)
	if err != nil {
		return nil, types.NewOpenAIError(err, types.ErrorCodeDoRequestFailed, http.StatusInternalServerError)
	}

	statusCodeMappingStr := c.GetString("status_code_mapping")

	var httpResp *http.Response
	if resp != nil {
		httpResp = resp.(*http.Response)
		if httpResp.StatusCode != http.StatusOK {
			newAPIError := service.RelayErrorHandler(c.Request.Context(), httpResp, false)
			service.ResetStatusCode(newAPIError, statusCodeMappingStr)
			return nil, newAPIError
		}
	}

	// 6. Handle response.
	// For streaming, convert Chat Completions SSE back to Responses API SSE
	// format so that clients (e.g. Codex) receive the format they expect.
	var usage *dto.Usage
	if info.IsStream {
		var newAPIError *types.NewAPIError
		usage, newAPIError = openaichannel.ChatStreamToResponsesStreamHandler(c, info, httpResp)
		if newAPIError != nil {
			service.ResetStatusCode(newAPIError, statusCodeMappingStr)
			return nil, newAPIError
		}
	} else {
		usageAny, newAPIError := adaptor.DoResponse(c, httpResp, info)
		if newAPIError != nil {
			service.ResetStatusCode(newAPIError, statusCodeMappingStr)
			return nil, newAPIError
		}
		usage = usageAny.(*dto.Usage)
	}

	return usage, nil
}
