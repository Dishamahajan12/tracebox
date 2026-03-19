package com.example.demo.role.service.impl;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.demo.common.util.DtoMapper;
import com.example.demo.role.dto.RoleResponse;
import com.example.demo.role.entity.Role;
import com.example.demo.role.entity.RoleName;
import com.example.demo.role.exception.RoleNotFoundException;
import com.example.demo.role.repository.RoleRepository;
import com.example.demo.role.service.RoleService;

@Service
@Transactional(readOnly = true)
public class RoleServiceImpl implements RoleService {

    private final RoleRepository roleRepository;

    public RoleServiceImpl(RoleRepository roleRepository) {
        this.roleRepository = roleRepository;
    }

    @Override
    public List<RoleResponse> getAllRoles() {
        return roleRepository.findAll().stream()
                .map(DtoMapper::toRoleResponse)
                .toList();
    }

    @Override
    public Role getRequiredRole(RoleName roleName) {
        return roleRepository.findByName(roleName)
                .orElseThrow(() -> new RoleNotFoundException("Role not found: " + roleName));
    }
}
