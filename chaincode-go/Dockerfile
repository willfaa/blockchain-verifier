# Multi-stage build for Fabric Chaincode-as-a-Service (CCAAS)
FROM golang:1.24-alpine AS builder

WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download

COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -o chaincode .

FROM alpine:latest
WORKDIR /app
COPY --from=builder /app/chaincode /app/chaincode

EXPOSE 9999
CMD ["/app/chaincode"]
