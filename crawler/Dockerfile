FROM --platform=linux/amd64 python:3

WORKDIR /usr/src/app

COPY ./crawler .
COPY ./db ../db

RUN pip install --no-cache-dir -r requirements.txt

EXPOSE 5001

CMD ["python3", "app.py"]