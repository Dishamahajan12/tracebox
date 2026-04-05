package com.example.demo.user.service;

import com.example.demo.user.dto.UpdateUserRequest;
import com.example.demo.user.dto.UserResponse;
import com.example.demo.user.entity.User;

public interface UserService {

    UserResponse getCurrentUser();

    UserResponse getUserProfile(Long userId);

    UserResponse updateCurrentUser(UpdateUserRequest request);

    User getRequiredUser(Long userId);
}
