import React from "react";
import { Box, Text, H4, MessageBox, Icon } from "@adminjs/design-system";

const ApproveSuccess = ({ record }) => {
  console.log(record.params);
  const title = record?.params?.title || "Listing";

  return (
    <Box padding="xl">
      <MessageBox variant="success" mb="xl">
        <Icon icon="CheckCircle" color="green100" size={24} />
        <Text ml="default">
          {title} has been <strong>approved successfully</strong>.
        </Text>
      </MessageBox>

      <Box mt="xl">
        <H4>Thank you!</H4>
        <Text>
          This listing is now visible to users and marked as approved.
        </Text>
      </Box>
    </Box>
  );
};

export default ApproveSuccess;
