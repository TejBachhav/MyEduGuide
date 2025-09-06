from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .routes import auth, profile

app = FastAPI()

origins = [
    "http://localhost:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(profile.router, prefix="/profile", tags=["profile"])

@app.get("/")
def read_root():
    return {"message": "Welcome to the Career Guidance Portal API"}
