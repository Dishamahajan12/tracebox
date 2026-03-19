package com.example.demo.auth.exception;

import com.example.demo.common.exception.BadRequestException;

public class OtpExpiredException extends BadRequestException {

    public OtpExpiredException() {
        super("OTP expired");
    }
}
