package com.example.demo.common.config;

import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;

import com.example.demo.projectmember.entity.ProjectTeamRole;
import com.example.demo.projectmember.repository.ProjectMemberRepository;
import com.example.demo.role.entity.Role;
import com.example.demo.role.entity.RoleName;
import com.example.demo.role.repository.RoleRepository;
import com.example.demo.task.repository.TaskRepository;
import com.example.demo.user.repository.UserRepository;

@Configuration
public class SeedDataConfig {

    @Bean
    @Order(1)
    public CommandLineRunner seedRoles(RoleRepository roleRepository) {
        return args -> {
            for (RoleName roleName : RoleName.values()) {
                roleRepository.findByName(roleName)
                        .orElseGet(() -> roleRepository.save(new Role(roleName)));
            }
        };
    }

    @Bean
    @Order(2)
    public CommandLineRunner ensureUsersHaveRoles(RoleRepository roleRepository, UserRepository userRepository) {
        return args -> {
            Role defaultRole = roleRepository.findByName(RoleName.USER)
                    .orElseGet(() -> roleRepository.save(new Role(RoleName.USER)));
            userRepository.findAll().forEach(user -> {
                if (user.getRole() == null) {
                    user.setRole(defaultRole);
                }
                user.setActive(user.isActive());
                userRepository.save(user);
            });
        };
    }

    @Bean
    @Order(3)
    public CommandLineRunner ensureTaskStatusConstraint(JdbcTemplate jdbcTemplate) {
        return args -> {
            jdbcTemplate.execute("ALTER TABLE tasks DROP CONSTRAINT IF EXISTS tasks_status_check");
            jdbcTemplate.update("UPDATE tasks SET status = 'NEW' WHERE status = 'TODO'");
            jdbcTemplate.update("UPDATE tasks SET status = 'COMPLETED' WHERE status = 'DONE'");
            jdbcTemplate.execute(
                    "ALTER TABLE tasks ADD CONSTRAINT tasks_status_check CHECK (status IN ('NEW','IN_PROGRESS','IN_REVIEW','COMPLETED'))");
        };
    }

    @Bean
    @Order(4)
    public CommandLineRunner ensureTaskDeleteConstraints(JdbcTemplate jdbcTemplate) {
        return args -> {
            jdbcTemplate.execute("ALTER TABLE comments DROP CONSTRAINT IF EXISTS FKi7pp0331nbiwd2844kg78kfwb");
            jdbcTemplate.execute("ALTER TABLE comments DROP CONSTRAINT IF EXISTS fk_comments_task_cascade");
            jdbcTemplate.execute(
                    "ALTER TABLE comments ADD CONSTRAINT fk_comments_task_cascade FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE");

            jdbcTemplate.execute("ALTER TABLE task_history DROP CONSTRAINT IF EXISTS FKjqraeud129avhcva579fhioj3");
            jdbcTemplate.execute("ALTER TABLE task_history DROP CONSTRAINT IF EXISTS fk_task_history_task_cascade");
            jdbcTemplate.execute(
                    "ALTER TABLE task_history ADD CONSTRAINT fk_task_history_task_cascade FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE");

            jdbcTemplate.execute("ALTER TABLE task_attachments DROP CONSTRAINT IF EXISTS FK4eyiisq4wyx2mfj3p9h8ppufo");
            jdbcTemplate.execute("ALTER TABLE task_attachments DROP CONSTRAINT IF EXISTS fk_task_attachments_task_cascade");
            jdbcTemplate.execute(
                    "ALTER TABLE task_attachments ADD CONSTRAINT fk_task_attachments_task_cascade FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE");

            jdbcTemplate.execute("ALTER TABLE tasks DROP CONSTRAINT IF EXISTS FK67ic7po100gmcashq053taew7");
            jdbcTemplate.execute("ALTER TABLE tasks DROP CONSTRAINT IF EXISTS fk_tasks_linked_ticket_set_null");
            jdbcTemplate.execute(
                    "ALTER TABLE tasks ADD CONSTRAINT fk_tasks_linked_ticket_set_null FOREIGN KEY (linked_ticket_id) REFERENCES tasks(id) ON DELETE SET NULL");

            jdbcTemplate.execute("ALTER TABLE tasks DROP CONSTRAINT IF EXISTS FKluibk4wowow4ot81ggvmh4wb4");
            jdbcTemplate.execute("ALTER TABLE tasks DROP CONSTRAINT IF EXISTS fk_tasks_original_replica_set_null");
            jdbcTemplate.execute(
                    "ALTER TABLE tasks ADD CONSTRAINT fk_tasks_original_replica_set_null FOREIGN KEY (original_replica_ticket_id) REFERENCES tasks(id) ON DELETE SET NULL");
        };
    }

    @Bean
    @Order(5)
    public CommandLineRunner ensureProjectMembersHaveTeamRoles(ProjectMemberRepository projectMemberRepository) {
        return args -> projectMemberRepository.findAll().forEach(member -> {
            if (member.getStoredTeamRole() == null) {
                member.setTeamRole(ProjectTeamRole.defaultForAccessRole(member.getProjectRole()));
                projectMemberRepository.save(member);
            }
        });
    }

    @Bean
    @Order(6)
    public CommandLineRunner ensureTasksHaveTicketNumbers(TaskRepository taskRepository) {
        return args -> taskRepository.findAllByTicketNumberIsNull().forEach(task -> {
            task.setTicketNumber("TKT-" + (task.getId() + 100));
            taskRepository.save(task);
        });
    }
}
