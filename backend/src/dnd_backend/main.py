import uvicorn

def main():
    uvicorn.run("dnd_backend.router:app", reload=True)

if __name__ == "__main__":
    main()
