package com.example.demo.role.service;

import java.util.List;

import com.example.demo.role.dto.RoleResponse;
import com.example.demo.role.entity.Role;
import com.example.demo.role.entity.RoleName;

public interface RoleService {

    List<RoleResponse> getAllRoles();

    Role getRequiredRole(RoleName roleName);
}
