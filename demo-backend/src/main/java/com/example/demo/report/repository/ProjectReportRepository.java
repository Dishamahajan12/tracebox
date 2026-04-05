package com.example.demo.report.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import com.example.demo.report.entity.ProjectReport;

public interface ProjectReportRepository extends JpaRepository<ProjectReport, Long>, JpaSpecificationExecutor<ProjectReport> {
}
