package chaincode

import (
	"encoding/json"
	"fmt"

	"github.com/hyperledger/fabric-contract-api-go/v2/contractapi"
)

type SmartContract struct {
	contractapi.Contract
}

type Certificate struct {
	CertID           string `json:"cert_id"`
	Name             string `json:"name"`
	NISN             string `json:"nisn"`
	Program          string `json:"program"`
	Majority         string `json:"majority"`
	IssuedAt         string `json:"issued_at"`
	Hash             string `json:"hash"`
	CID              string `json:"cid"`
	Status           string `json:"status"`            
	Nonce            string `json:"nonce"`             
	RevokedAt        string `json:"revoked_at"`        
	RevocationReason string `json:"revocation_reason"` 
	SupersededBy     string `json:"superseded_by"`     
	IssuerID         string `json:"issuer_id"`         
	IssuerRole       string `json:"issuer_role"`       
}

func (s *SmartContract) InitLedger(ctx contractapi.TransactionContextInterface) error {
	return nil
}

func (s *SmartContract) IssueCertificate(ctx contractapi.TransactionContextInterface, certId string, name string, nisn string, program string, majority string, issuedAt string, hash string, cid string, status string, nonce string, issuerId string, issuerRole string) error {
	exists, err := s.CertificateExists(ctx, certId)
	if err != nil {
		return err
	}
	if exists {
		return fmt.Errorf("the certificate %s already exists", certId)
	}

	cert := Certificate{
		CertID:           certId,
		Name:             name,
		NISN:             nisn,
		Program:          program,
		Majority:         majority,
		IssuedAt:         issuedAt,
		Hash:             hash,
		CID:              cid,
		Status:           status,
		Nonce:            nonce,
		RevokedAt:        "",
		RevocationReason: "",
		SupersededBy:     "",
		IssuerID:         issuerId,
		IssuerRole:       issuerRole,
	}

	certJSON, err := json.Marshal(cert)
	if err != nil {
		return err
	}

	return ctx.GetStub().PutState(certId, certJSON)
}

func (s *SmartContract) RevokeCertificate(ctx contractapi.TransactionContextInterface, certId string, revocationReason string, revokedAt string) error {
	cert, err := s.ReadCertificate(ctx, certId)
	if err != nil {
		return err
	}

	if cert.Status == "REVOKED" {
		return fmt.Errorf("certificate %s is already revoked", certId)
	}

	cert.Status = "REVOKED"
	cert.RevocationReason = revocationReason
	cert.RevokedAt = revokedAt

	certJSON, err := json.Marshal(cert)
	if err != nil {
		return err
	}

	return ctx.GetStub().PutState(certId, certJSON)
}

func (s *SmartContract) SupersedeCertificate(ctx contractapi.TransactionContextInterface, oldCertId string, newCertId string, reason string) error {
	cert, err := s.ReadCertificate(ctx, oldCertId)
	if err != nil {
		return err
	}

	if cert.Status != "ISSUED" {
		return fmt.Errorf("certificate %s cannot be superseded because it is not in ISSUED state", oldCertId)
	}

	cert.Status = "SUPERSEDED"
	cert.SupersededBy = newCertId
	cert.RevocationReason = reason

	certJSON, err := json.Marshal(cert)
	if err != nil {
		return err
	}

	return ctx.GetStub().PutState(oldCertId, certJSON)
}

func (s *SmartContract) ReadCertificate(ctx contractapi.TransactionContextInterface, certId string) (*Certificate, error) {
	certJSON, err := ctx.GetStub().GetState(certId)
	if err != nil {
		return nil, fmt.Errorf("failed to read from world state: %v", err)
	}
	if certJSON == nil {
		return nil, fmt.Errorf("the certificate %s does not exist", certId)
	}

	var cert Certificate
	err = json.Unmarshal(certJSON, &cert)
	if err != nil {
		return nil, err
	}

	return &cert, nil
}

func (s *SmartContract) CertificateExists(ctx contractapi.TransactionContextInterface, certId string) (bool, error) {
	certJSON, err := ctx.GetStub().GetState(certId)
	if err != nil {
		return false, fmt.Errorf("failed to read from world state: %v", err)
	}

	return certJSON != nil, nil
}

func (s *SmartContract) GetAllCertificates(ctx contractapi.TransactionContextInterface) ([]*Certificate, error) {
	resultsIterator, err := ctx.GetStub().GetStateByRange("", "")
	if err != nil {
		return nil, err
	}
	defer resultsIterator.Close()

	var certs []*Certificate
	for resultsIterator.HasNext() {
		queryResponse, err := resultsIterator.Next()
		if err != nil {
			return nil, err
		}

		var cert Certificate
		err = json.Unmarshal(queryResponse.Value, &cert)
		if err != nil {
			return nil, err
		}
		certs = append(certs, &cert)
	}

	return certs, nil
}