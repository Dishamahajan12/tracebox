package com.example.demo.task.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.example.demo.task.entity.TaskAttachment;

public interface TaskAttachmentRepository extends JpaRepository<TaskAttachment, Long> {

    @Query("""
            select
                a.id as id,
                t.id as taskId,
                a.fileName as fileName,
                a.contentType as contentType,
                a.fileSize as fileSize,
                u.id as uploadedById,
                u.fullName as uploadedByFullName,
                u.email as uploadedByEmail,
                r.name as uploadedByRole,
                a.createdAt as createdAt
            from TaskAttachment a
            join a.task t
            join a.uploadedBy u
            left join u.role r
            where t.id = :taskId
            order by a.createdAt desc
            """)
    java.util.List<TaskAttachmentListProjection> findAttachmentMetadataByTaskId(@Param("taskId") Long taskId);

    Optional<TaskAttachment> findByIdAndTaskId(Long attachmentId, Long taskId);
}
