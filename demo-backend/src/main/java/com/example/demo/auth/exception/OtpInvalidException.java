package com.example.demo.auth.exception;

import com.example.demo.common.exception.BadRequestException;

public class OtpInvalidException extends BadRequestException {

    public OtpInvalidException() {
        super("Invalid OTP");
    }
}
