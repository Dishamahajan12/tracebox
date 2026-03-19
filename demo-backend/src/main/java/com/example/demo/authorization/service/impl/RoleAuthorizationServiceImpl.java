package com.example.demo.authorization.service.impl;

import java.util.Arrays;

import org.springframework.stereotype.Service;

import com.example.demo.authorization.exception.AccessDeniedException;
import com.example.demo.authorization.service.RoleAuthorizationService;
import com.example.demo.role.entity.RoleName;
import com.example.demo.user.repository.UserRepository;

@Service
public class RoleAuthorizationServiceImpl implements RoleAuthorizationService {

    private final UserRepository userRepository;

    public RoleAuthorizationServiceImpl(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    public void requireAnyRole(Long userId, RoleName... roles) {
        if (!hasAnyRole(userId, roles)) {
            throw new AccessDeniedException("You do not have permission to perform this action");
        }
    }

    @Override
    public boolean hasAnyRole(Long userId, RoleName... roles) {
        return userRepository.findById(userId)
                .map(user -> Arrays.stream(roles).anyMatch(role -> role == user.getRoleName()))
                .orElse(false);
    }
}
