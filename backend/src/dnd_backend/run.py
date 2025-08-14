import uvicorn

def main():
    uvicorn.run("dnd_backend.main:app", reload=True)

if __name__ == "__main__":
    main()
