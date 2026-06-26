package console_setting

import "github.com/QuantumNous/new-api/setting/config"

type ConsoleSetting struct {
	ApiInfo              string `json:"api_info"`              // 控制台 API 信息 (JSON 数组字符串)
	UptimeKumaGroups     string `json:"uptime_kuma_groups"`    // Uptime Kuma 分组配置 (JSON 数组字符串)
	Announcements        string `json:"announcements"`         // 系统公告 (JSON 数组字符串)
	FAQ                  string `json:"faq"`                   // 常见问题 (JSON 数组字符串)
	HomePricing          string `json:"home_pricing"`          // 首页模型定价 (JSON 数组字符串)
	CustomerService      string `json:"customer_service"`      // 客服联系方式 (JSON 对象字符串: {title, description, items:[{label,image}]})
	ApiInfoEnabled       bool   `json:"api_info_enabled"`      // 是否启用 API 信息面板
	UptimeKumaEnabled    bool   `json:"uptime_kuma_enabled"`   // 是否启用 Uptime Kuma 面板
	AnnouncementsEnabled bool   `json:"announcements_enabled"` // 是否启用系统公告面板
	FAQEnabled           bool   `json:"faq_enabled"`           // 是否启用常见问答面板
	HomePricingEnabled   bool   `json:"home_pricing_enabled"`  // 是否启用首页模型定价

	CustomerServiceEnabled bool `json:"customer_service_enabled"` // 是否启用客服入口
}

// 默认配置
var defaultConsoleSetting = ConsoleSetting{
	ApiInfo:              "",
	UptimeKumaGroups:     "",
	Announcements:        "",
	FAQ:                  "",
	HomePricing:          "",
	CustomerService:      "",
	ApiInfoEnabled:       true,
	UptimeKumaEnabled:    true,
	AnnouncementsEnabled: true,
	FAQEnabled:           true,
	HomePricingEnabled:   true,

	CustomerServiceEnabled: false,
}

// 全局实例
var consoleSetting = defaultConsoleSetting

func init() {
	// 注册到全局配置管理器，键名为 console_setting
	config.GlobalConfig.Register("console_setting", &consoleSetting)
}

// GetConsoleSetting 获取 ConsoleSetting 配置实例
func GetConsoleSetting() *ConsoleSetting {
	return &consoleSetting
}
