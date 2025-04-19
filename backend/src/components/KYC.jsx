import React, { useState } from "react";
import {
  Box,
  H2,
  Text,
  Table,
  TableRow,
  TableCell,
  Badge,
  Button,
  Loader,
} from "@adminjs/design-system";
import { ActionHeader, ApiClient } from "adminjs";

const api = new ApiClient();

const styles = {
  section: {
    backgroundColor: "white",
    padding: "24px",
    borderRadius: "8px",
    marginBottom: "24px",
    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
  },
  image: {
    width: "100%",
    maxWidth: "400px",
    height: "auto",
    borderRadius: "8px",
    marginTop: "16px",
  },
};

const KYCShow = (props) => {
  const { record, resource, action } = props;
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(record.params.status);

  const handleApprove = async () => {
    try {
      setLoading(true);

      const response = await api.recordAction({
        resourceId: resource.id,
        recordId: record.id,
        actionName: "approve",
      });

      if (response.data?.record?.params?.status === "approved") {
        setStatus("approved");
      }

      setLoading(false);
    } catch (err) {
      console.error("Approval error:", err);
      setLoading(false);
    }
  };

  const {
    id,
    user,
    verificationType,
    ssn,
    passportNumber,
    passportDocument,
    visaDocument,
    createdAt,
  } = record.params;

  return (
    <Box style={styles.section}>
      <ActionHeader resource={resource} record={record} action={action} />
      <H2>KYC Verification</H2>

      <Table>
        <TableRow>
          <TableCell>ID</TableCell>
          <TableCell>{id}</TableCell>
        </TableRow>
        <TableRow>
          <TableCell>User</TableCell>
          <TableCell>{user}</TableCell>
        </TableRow>
        <TableRow>
          <TableCell>Verification Type</TableCell>
          <TableCell>{verificationType}</TableCell>
        </TableRow>
        <TableRow>
          <TableCell>SSN</TableCell>
          <TableCell>{ssn}</TableCell>
        </TableRow>
        <TableRow>
          <TableCell>Passport Number</TableCell>
          <TableCell>{passportNumber}</TableCell>
        </TableRow>
        <TableRow>
          <TableCell>Status</TableCell>
          <TableCell>
            <Badge variant="primary">{status}</Badge>
          </TableCell>
        </TableRow>
        <TableRow>
          <TableCell>Created At</TableCell>
          <TableCell>{new Date(createdAt).toLocaleString()}</TableCell>
        </TableRow>
      </Table>

      {passportDocument && (
        <Box>
          <Text mt="xl">Passport Document</Text>
          <img
            src={passportDocument}
            alt="Passport Document"
            style={styles.image}
          />
        </Box>
      )}

      {visaDocument && (
        <Box>
          <Text mt="xl">Visa Document</Text>
          <img src={visaDocument} alt="Visa Document" style={styles.image} />
        </Box>
      )}

      <Box mt="xl">
        <Button
          variant="success"
          onClick={handleApprove}
          disabled={loading || status === "approved"}
        >
          {loading ? (
            <Loader />
          ) : status === "approved" ? (
            "Approved"
          ) : (
            "Approve KYC"
          )}
        </Button>
      </Box>
    </Box>
  );
};

export default KYCShow;
