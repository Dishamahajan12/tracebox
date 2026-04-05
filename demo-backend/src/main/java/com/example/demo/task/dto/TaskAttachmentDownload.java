package com.example.demo.task.dto;

public record TaskAttachmentDownload(
        String fileName,
        String contentType,
        byte[] content) {
}
