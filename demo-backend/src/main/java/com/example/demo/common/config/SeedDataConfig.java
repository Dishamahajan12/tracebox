package com.example.demo.common.config;

import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.Order;

import com.example.demo.role.entity.Role;
import com.example.demo.role.entity.RoleName;
import com.example.demo.role.repository.RoleRepository;
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
}
