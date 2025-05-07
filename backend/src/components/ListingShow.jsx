import React from "react";
import {
  Box,
  H2,
  Text,
  ValueGroup,
  Table,
  TableRow,
  TableCell,
  Button,
  Loader,
} from "@adminjs/design-system";
import {
  Home,
  MapPin,
  DollarSign,
  Maximize,
  Building2,
  Bath,
  Bed,
  Eye,
  Calendar,
} from "lucide-react";
import { ActionHeader, ApiClient } from "adminjs";
import { useState } from "react";
const api = new ApiClient();

const styles = {
  container: {
    margin: "24px",
  },
  header: {
    marginBottom: "24px",
  },
  section: {
    backgroundColor: "white",
    padding: "24px",
    borderRadius: "8px",
    marginBottom: "24px",
    boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "16px",
    marginBottom: "24px",
  },
  statCard: {
    padding: "16px",
    backgroundColor: "#f8fafc",
    borderRadius: "8px",
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  icon: {
    width: "24px",
    height: "24px",
    color: "#4f46e5",
  },
  label: {
    fontSize: "14px",
    color: "#64748b",
    marginBottom: "4px",
  },
  value: {
    fontSize: "16px",
    fontWeight: 600,
    color: "#1e293b",
  },
  imageGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
    gap: "16px",
    marginTop: "16px",
  },
  image: {
    width: "100%",
    height: "150px",
    objectFit: "cover",
    borderRadius: "8px",
  },
};

const ListingShow = (props) => {
  const { record, resource, action } = props;
  const [loading, setLoading] = useState(false);
  const [approve, setApprove] = useState(record.params.approve);
  if (!record) return null;

  const handleApprove = async () => {
    try {
      setLoading(true);

      const response = await api.recordAction({
        resourceId: resource.id,
        recordId: record.id,
        actionName: "approve",
      });

      if (response.data?.record?.params?.approve === "approved") {
        setApprove("approved");
      }

      setLoading(false);
    } catch (err) {
      console.error("Approval error:", err);
      setLoading(false);
    }
  };

  const params = record.params;

  // Extract image URLs from flat keys like "images.0.url"
  const images = Object.keys(params)
    .filter((key) => key.startsWith("images.") && key.endsWith(".url"))
    .sort((a, b) => a.localeCompare(b))
    .map((key) => params[key])
    .filter(Boolean); // remove null/undefined

  const amenities = Object.keys(params)
    .filter((key) => key.startsWith("amenities."))
    .sort((a, b) => a.localeCompare(b))
    .map((key) => params[key])
    .filter(Boolean);

  const {
    title,
    description,
    price,
    size,
    floor,
    location,
    status,
    propertyType,
    rooms,
    beds,
    bathrooms,
    viewCount,
    createdAt,
  } = params;

  const locationGeo = {
    type: params["locationGeo.type"] || "Unknown",
    coordinates: [],
  };

  if (
    params["locationGeo.coordinates.0"] &&
    params["locationGeo.coordinates.1"]
  ) {
    locationGeo.coordinates = [
      parseFloat(params["locationGeo.coordinates.0"]),
      parseFloat(params["locationGeo.coordinates.1"]),
    ];
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(price);
  };

  return (
    <Box style={styles.container}>
      {/* Drawer Section */}
      <ActionHeader resource={resource} record={record} action={action} />
      <Box style={styles.section}>
        <Box style={styles.header}>
          <H2>{title}</H2>
          <Text>{location}</Text>
        </Box>

        <Box style={styles.grid}>
          {/* Display Price, Size, Floor, etc. */}
          <div style={styles.statCard}>
            <DollarSign style={styles.icon} />
            <div>
              <div style={styles.label}>Price</div>
              <div style={styles.value}>{formatPrice(price)}</div>
            </div>
          </div>

          <div style={styles.statCard}>
            <Maximize style={styles.icon} />
            <div>
              <div style={styles.label}>Size</div>
              <div style={styles.value}>{size} sq ft</div>
            </div>
          </div>

          <div style={styles.statCard}>
            <Building2 style={styles.icon} />
            <div>
              <div style={styles.label}>Floor</div>
              <div style={styles.value}>{floor}</div>
            </div>
          </div>

          <div style={styles.statCard}>
            <Home style={styles.icon} />
            <div>
              <div style={styles.label}>Rooms</div>
              <div style={styles.value}>{rooms}</div>
            </div>
          </div>

          <div style={styles.statCard}>
            <Bed style={styles.icon} />
            <div>
              <div style={styles.label}>Beds</div>
              <div style={styles.value}>{beds}</div>
            </div>
          </div>

          <div style={styles.statCard}>
            <Bath style={styles.icon} />
            <div>
              <div style={styles.label}>Bathrooms</div>
              <div style={styles.value}>{bathrooms}</div>
            </div>
          </div>

          <div style={styles.statCard}>
            <Eye style={styles.icon} />
            <div>
              <div style={styles.label}>Views</div>
              <div style={styles.value}>{viewCount}</div>
            </div>
          </div>

          <div style={styles.statCard}>
            <Calendar style={styles.icon} />
            <div>
              <div style={styles.label}>Listed On</div>
              <div style={styles.value}>{formatDate(createdAt)}</div>
            </div>
          </div>
        </Box>

        {/* Status, Property Type, and Description */}
        <ValueGroup label="Status" value={status} />
        <ValueGroup label="Property Type" value={propertyType} />
        <ValueGroup label="Description" value={description} />
      </Box>

      {/* Location Details Section */}
      <Box style={styles.section}>
        <H2>Location Details</H2>
        <Table>
          <tbody>
            <TableRow>
              <TableCell>Type</TableCell>
              <TableCell>{locationGeo.type}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Coordinates</TableCell>
              <TableCell>
                {locationGeo.coordinates.length > 0
                  ? locationGeo.coordinates.join(", ")
                  : "Not available"}
              </TableCell>
            </TableRow>

            <TableRow>
              <TableCell>Address</TableCell>
              <TableCell>{location}</TableCell>
            </TableRow>
          </tbody>
        </Table>
      </Box>

      {/* Amenities Section */}
      {amenities.length > 0 && (
        <Box style={styles.section}>
          <H2>Amenities</H2>
          <Box
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "8px",
              marginTop: "16px",
            }}
          >
            {amenities.map((amenity, index) => (
              <Box
                key={index}
                style={{
                  padding: "8px 16px",
                  backgroundColor: "#f1f5f9",
                  borderRadius: "16px",
                  fontSize: "14px",
                }}
              >
                {amenity}
              </Box>
            ))}
          </Box>
        </Box>
      )}

      <Box mt="xl">
        <Button
          variant="success"
          onClick={handleApprove}
          disabled={loading || approve === true}
        >
          {loading ? (
            <Loader />
          ) : approve /* If approve is a boolean */ ? (
            "Approved"
          ) : (
            "Approve Listing"
          )}
        </Button>
      </Box>

      {/* Images Section */}
      {images.length > 0 && (
        <Box style={styles.section}>
          <H2>Images</H2>
          <Box style={styles.imageGrid}>
            {images.map((image, index) => (
              <img
                key={index}
                src={image}
                alt={`Property image ${index + 1}`}
                style={styles.image}
              />
            ))}
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default ListingShow;
