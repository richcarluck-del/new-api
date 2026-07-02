package system_setting

import "github.com/QuantumNous/new-api/setting/config"

type LegalSettings struct {
	UserAgreement            string `json:"user_agreement"`
	PrivacyPolicy            string `json:"privacy_policy"`
	CrossBorderTransfer      string `json:"cross_border_transfer"`
	UserAgreementTitle       string `json:"user_agreement_title"`
	PrivacyPolicyTitle       string `json:"privacy_policy_title"`
	CrossBorderTransferTitle string `json:"cross_border_transfer_title"`
	UpdatedAt                string `json:"updated_at"` // 协议更新日期(管理员手填，如 2026-06-28)，同意弹窗展示
}

var defaultLegalSettings = LegalSettings{
	UserAgreement:            "",
	PrivacyPolicy:            "",
	CrossBorderTransfer:      "",
	UserAgreementTitle:       "",
	PrivacyPolicyTitle:       "",
	CrossBorderTransferTitle: "",
	UpdatedAt:                "",
}

func init() {
	config.GlobalConfig.Register("legal", &defaultLegalSettings)
}

func GetLegalSettings() *LegalSettings {
	return &defaultLegalSettings
}
