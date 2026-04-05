package com.example.demo.user.service.impl;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.demo.common.security.SecurityUtils;
import com.example.demo.common.util.DtoMapper;
import com.example.demo.user.dto.UpdateUserRequest;
import com.example.demo.user.dto.UserResponse;
import com.example.demo.user.entity.User;
import com.example.demo.user.exception.UserNotFoundException;
import com.example.demo.user.repository.UserRepository;
import com.example.demo.user.service.UserService;

@Service
@Transactional
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;

    public UserServiceImpl(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public UserResponse getCurrentUser() {
        return DtoMapper.toUserResponse(getRequiredUser(SecurityUtils.getCurrentUserId()));
    }

    @Override
    @Transactional(readOnly = true)
    public UserResponse getUserProfile(Long userId) {
        return DtoMapper.toUserResponse(getRequiredUser(userId));
    }

    @Override
    public UserResponse updateCurrentUser(UpdateUserRequest request) {
        User user = getRequiredUser(SecurityUtils.getCurrentUserId());
        user.setFullName(request.fullName().trim());
        return DtoMapper.toUserResponse(userRepository.save(user));
    }

    @Override
    @Transactional(readOnly = true)
    public User getRequiredUser(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new UserNotFoundException(userId));
    }
}
