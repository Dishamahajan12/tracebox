package com.example.demo.task.repository;

import java.time.Instant;

import com.example.demo.role.entity.RoleName;

public interface TaskAttachmentListProjection {

    Long getId();

    Long getTaskId();

    String getFileName();

    String getContentType();

    long getFileSize();

    Long getUploadedById();

    String getUploadedByFullName();

    String getUploadedByEmail();

    RoleName getUploadedByRole();

    Instant getCreatedAt();
}
