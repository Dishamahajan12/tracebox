package com.example.demo.admin.service.impl;

import java.util.List;

import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.demo.admin.dto.AdminDashboardResponse;
import com.example.demo.admin.dto.AdminUserUpdateRequest;
import com.example.demo.admin.service.AdminService;
import com.example.demo.authorization.service.RoleAuthorizationService;
import com.example.demo.comment.repository.CommentRepository;
import com.example.demo.common.exception.BadRequestException;
import com.example.demo.common.security.SecurityUtils;
import com.example.demo.common.util.DtoMapper;
import com.example.demo.project.repository.ProjectRepository;
import com.example.demo.role.entity.Role;
import com.example.demo.role.entity.RoleName;
import com.example.demo.role.service.RoleService;
import com.example.demo.task.repository.TaskRepository;
import com.example.demo.user.dto.UserResponse;
import com.example.demo.user.entity.User;
import com.example.demo.user.repository.UserRepository;
import com.example.demo.user.service.UserService;

@Service
@Transactional
public class AdminServiceImpl implements AdminService {

    private final UserRepository userRepository;
    private final ProjectRepository projectRepository;
    private final TaskRepository taskRepository;
    private final CommentRepository commentRepository;
    private final UserService userService;
    private final RoleService roleService;
    private final RoleAuthorizationService roleAuthorizationService;

    public AdminServiceImpl(
            UserRepository userRepository,
            ProjectRepository projectRepository,
            TaskRepository taskRepository,
            CommentRepository commentRepository,
            UserService userService,
            RoleService roleService,
            RoleAuthorizationService roleAuthorizationService) {
        this.userRepository = userRepository;
        this.projectRepository = projectRepository;
        this.taskRepository = taskRepository;
        this.commentRepository = commentRepository;
        this.userService = userService;
        this.roleService = roleService;
        this.roleAuthorizationService = roleAuthorizationService;
    }

    @Override
    @Transactional(readOnly = true)
    public AdminDashboardResponse getDashboard() {
        requireAdminAccess();
        return new AdminDashboardResponse(
                userRepository.count(),
                userRepository.countByActiveTrue(),
                projectRepository.count(),
                taskRepository.count(),
                commentRepository.count());
    }

    @Override
    @Transactional(readOnly = true)
    public List<UserResponse> getUsers() {
        requireAdminAccess();
        return userRepository.findAll(Sort.by(Sort.Direction.DESC, "createdAt")).stream()
                .map(DtoMapper::toUserResponse)
                .toList();
    }

    @Override
    public UserResponse updateUser(Long userId, AdminUserUpdateRequest request) {
        Long currentUserId = requireAdminAccess();
        if (currentUserId.equals(userId) && Boolean.FALSE.equals(request.active())) {
            throw new BadRequestException("You cannot deactivate your own account");
        }

        User user = userService.getRequiredUser(userId);
        Role role = roleService.getRequiredRole(request.role());
        user.setRole(role);
        user.setActive(request.active());
        return DtoMapper.toUserResponse(userRepository.save(user));
    }

    private Long requireAdminAccess() {
        Long currentUserId = SecurityUtils.getCurrentUserId();
        roleAuthorizationService.requireAnyRole(currentUserId, RoleName.ADMIN, RoleName.SUPER_ADMIN);
        return currentUserId;
    }
}
