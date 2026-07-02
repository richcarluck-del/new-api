package model

import "time"

// UserConsent 记录用户对法律协议的单独同意（举证用）。
// 跨库兼容(SQLite/MySQL/PG): 纯 GORM Create + 标准列类型，无保留字、无 JSONB。
type UserConsent struct {
	Id          int    `json:"id" gorm:"primaryKey"`
	UserId      int    `json:"user_id" gorm:"index"`
	Username    string `json:"username" gorm:"type:varchar(64);index"`
	DocType     string `json:"doc_type" gorm:"type:varchar(32);index"` // user_agreement|privacy_policy|cross_border_transfer
	ContentHash string `json:"content_hash" gorm:"type:varchar(64)"`   // SHA256(文档原文)
	IP          string `json:"ip" gorm:"type:varchar(64)"`
	UserAgent   string `json:"user_agent" gorm:"type:varchar(512)"`
	CreatedAt   int64  `json:"created_at" gorm:"bigint"`
}

func RecordUserConsent(userId int, username, docType, contentHash, ip, ua string) error {
	if len(ua) > 512 {
		ua = ua[:512]
	}
	return DB.Create(&UserConsent{
		UserId:      userId,
		Username:    username,
		DocType:     docType,
		ContentHash: contentHash,
		IP:          ip,
		UserAgent:   ua,
		CreatedAt:   time.Now().Unix(),
	}).Error
}

// RecordUserConsentIfAbsent 幂等记录：同一用户+同一文档+同一版本(hash)已存在则跳过。
// 用于登录态重复同意 / 注册去重，避免同一版本协议反复落库。
func RecordUserConsentIfAbsent(userId int, username, docType, contentHash, ip, ua string) error {
	var cnt int64
	if err := DB.Model(&UserConsent{}).
		Where("user_id = ? AND doc_type = ? AND content_hash = ?", userId, docType, contentHash).
		Count(&cnt).Error; err != nil {
		return err
	}
	if cnt > 0 {
		return nil
	}
	return RecordUserConsent(userId, username, docType, contentHash, ip, ua)
}
