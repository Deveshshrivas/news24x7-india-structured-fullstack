from typing import Literal
from pydantic import BaseModel, EmailStr, Field

class RegisterInput(BaseModel):
    name: str = Field(min_length=2, max_length=80)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)

class LoginInput(BaseModel):
    email: EmailStr
    password: str

class OAuthExchangeInput(BaseModel):
    code: str

class UserRoleInput(BaseModel):
    role: Literal["super_admin", "admin", "editor", "reporter", "ad_manager"]
    active: bool = True

class CreateUserInput(BaseModel):
    name: str = Field(min_length=2, max_length=80)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    role: Literal["super_admin", "admin", "editor", "reporter", "ad_manager"] = "admin"

class BreakingNewsInput(BaseModel):
    text: str = Field(min_length=3, max_length=300)
    article_slug: str | None = None
    active: bool = True

class ArticleInput(BaseModel):
    title: str = Field(min_length=5, max_length=250)
    excerpt: str = Field(min_length=10, max_length=600)
    body: str = Field(min_length=20)
    category: str = Field(min_length=2, max_length=80)
    image_url: str | None = None
    status: Literal["draft", "review", "published"] = "draft"
    featured: bool = False
    seo_title: str | None = Field(default=None, max_length=70)
    seo_description: str | None = Field(default=None, max_length=170)
    seo_keywords: str | None = Field(default=None, max_length=500)
    seo_image_url: str | None = None
