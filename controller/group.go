package controller

import (
	"net/http"
	"sort"
	"strings"

	"github.com/QuantumNous/new-api/model"
	"github.com/QuantumNous/new-api/service"
	"github.com/QuantumNous/new-api/setting"
	"github.com/QuantumNous/new-api/setting/ratio_setting"

	"github.com/gin-gonic/gin"
)

func GetGroups(c *gin.Context) {
	groupNames := make([]string, 0)
	for groupName := range ratio_setting.GetGroupRatioCopy() {
		groupNames = append(groupNames, groupName)
	}
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "",
		"data":    groupNames,
	})
}

func GetUserGroups(c *gin.Context) {
	usableGroups := make(map[string]map[string]interface{})
	userGroup := ""
	userId := c.GetInt("id")
	userGroup, _ = model.GetUserGroup(userId, false)
	userUsableGroups := service.GetUserUsableGroups(userGroup)

	// 聚合每个分组的主厂商渠道类型与启用模型列表（失败降级为空，不阻断）
	vendorInfo, err := model.GetGroupVendorInfo()
	if err != nil {
		vendorInfo = map[string]model.GroupVendorInfo{}
	}

	for groupName := range ratio_setting.GetGroupRatioCopy() {
		// UserUsableGroups contains the groups that the user can use
		if desc, ok := userUsableGroups[groupName]; ok {
			entry := map[string]interface{}{
				"ratio": service.GetUserGroupRatio(userGroup, groupName),
				"desc":  desc,
			}
			if vi, ok := vendorInfo[groupName]; ok {
				entry["channel_type"] = vi.ChannelType
				entry["models"] = vi.Models
				entry["model_count"] = len(vi.Models)
			}
			usableGroups[groupName] = entry
		}
	}
	if _, ok := userUsableGroups["auto"]; ok {
		usableGroups["auto"] = map[string]interface{}{
			"ratio":        "自动",
			"desc":         setting.GetUsableGroupDescription("auto"),
			"channel_type": 0, // auto 无真实厂商
		}
	}
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "",
		"data":    usableGroups,
	})
}

type pricingGroupChannel struct {
	Id           int     `json:"id"`
	Name         string  `json:"name"`
	Type         int     `json:"type"`
	Status       int     `json:"status"`
	Priority     int64   `json:"priority"`
	ChannelRatio float64 `json:"channel_ratio"`
	Models       string  `json:"models"`
}

type pricingGroupRow struct {
	Group       string                `json:"group"`
	Ratio       float64               `json:"ratio"`
	Description string                `json:"description"`
	Channels    []pricingGroupChannel `json:"channels"`
}

// GetPricingGroupOverview 后台只读总览：列出每个定价分组及其下挂的渠道。
// 分组集合 = 倍率配置的 key ∪ 渠道里出现过的分组名；渠道按逗号拆分归属，
// 一个渠道属多个分组会在各分组下分别出现（便于以分组视角横向对比）。
func GetPricingGroupOverview(c *gin.Context) {
	ratios := ratio_setting.GetGroupRatioCopy()
	descriptions := setting.GetUserUsableGroupsCopy()

	channels, err := model.GetAllChannels(0, 0, true, false)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": err.Error(),
		})
		return
	}

	groupChannels := make(map[string][]pricingGroupChannel)
	for _, ch := range channels {
		entry := pricingGroupChannel{
			Id:           ch.Id,
			Name:         ch.Name,
			Type:         ch.Type,
			Status:       ch.Status,
			Priority:     ch.GetPriority(),
			ChannelRatio: ch.GetChannelRatio(),
			Models:       ch.Models,
		}
		for _, g := range strings.Split(ch.Group, ",") {
			g = strings.TrimSpace(g)
			if g == "" {
				continue
			}
			groupChannels[g] = append(groupChannels[g], entry)
		}
	}

	// 分组集合：倍率配置 ∪ 渠道归属
	groupSet := make(map[string]struct{})
	for g := range ratios {
		groupSet[g] = struct{}{}
	}
	for g := range groupChannels {
		groupSet[g] = struct{}{}
	}

	groupNames := make([]string, 0, len(groupSet))
	for g := range groupSet {
		groupNames = append(groupNames, g)
	}
	sort.Strings(groupNames)

	rows := make([]pricingGroupRow, 0, len(groupNames))
	for _, g := range groupNames {
		chs := groupChannels[g]
		// 组内渠道：优先级降序，再按 id 升序
		sort.Slice(chs, func(i, j int) bool {
			if chs[i].Priority != chs[j].Priority {
				return chs[i].Priority > chs[j].Priority
			}
			return chs[i].Id < chs[j].Id
		})
		rows = append(rows, pricingGroupRow{
			Group:       g,
			Ratio:       ratios[g],
			Description: descriptions[g],
			Channels:    chs,
		})
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "",
		"data":    rows,
	})
}
