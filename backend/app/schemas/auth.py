from pydantic import BaseModel, Field


class RegisterRequest(BaseModel):
    alias: str = Field(..., min_length=3, max_length=30)
    access_code: str = Field(..., min_length=8, max_length=8)


class LoginRequest(BaseModel):
    alias: str
    access_code: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
