import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";

/**
 * @param {{ name?: string, newEmail: string, confirmUrl: string }} props
 */
export function ChangeEmailConfirmation({
  name = "there",
  newEmail,
  confirmUrl,
}) {
  return (
    <Html>
      <Head />
      <Preview>Confirm your email change</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Approve email change</Heading>
          <Text style={text}>Hi {name},</Text>
          <Text style={text}>
            You requested to change your account email to{" "}
            <strong>{newEmail}</strong>. Confirm this change below.
          </Text>
          <Section style={btnSection}>
            <Button style={button} href={confirmUrl}>
              Confirm change
            </Button>
          </Section>
          <Text style={muted}>
            If you did not request this, secure your account and ignore this
            email.
          </Text>
          <Hr style={hr} />
          <Text style={footer}>ShopSphere | Secure authentication</Text>
        </Container>
      </Body>
    </Html>
  );
}

const main = {
  backgroundColor: "#f4f4f5",
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};
const container = {
  backgroundColor: "#ffffff",
  margin: "40px auto",
  padding: "32px 24px",
  borderRadius: "12px",
  maxWidth: "480px",
};
const h1 = { color: "#18181b", fontSize: "22px", fontWeight: "600", margin: "0 0 16px" };
const text = { color: "#3f3f46", fontSize: "15px", lineHeight: "24px", margin: "0 0 12px" };
const muted = { color: "#71717a", fontSize: "13px", lineHeight: "20px", margin: "16px 0 0" };
const btnSection = { textAlign: "center", margin: "28px 0" };
const button = {
  backgroundColor: "#0F766E",
  borderRadius: "10px",
  color: "#ffffff",
  fontSize: "15px",
  fontWeight: "600",
  textDecoration: "none",
  padding: "12px 24px",
  display: "inline-block",
};
const hr = { borderColor: "#e4e4e7", margin: "24px 0" };
const footer = { color: "#a1a1aa", fontSize: "12px", margin: 0 };
