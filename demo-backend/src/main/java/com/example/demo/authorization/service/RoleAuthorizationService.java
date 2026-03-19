package com.example.demo.authorization.service;

import com.example.demo.role.entity.RoleName;

public interface RoleAuthorizationService {

    void requireAnyRole(Long userId, RoleName... roles);

    boolean hasAnyRole(Long userId, RoleName... roles);
}
