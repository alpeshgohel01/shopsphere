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
import { formatCents } from "@/lib/shop/money";

/**
 * @param {{
 *   name?: string,
 *   orderNumber: string,
 *   items: { title: string, size?: string, quantity: number, price: number }[],
 *   subtotal: number,
 *   shippingFee: number,
 *   tax: number,
 *   total: number,
 *   orderUrl: string,
 *   demo?: boolean,
 * }} props amounts are integer cents
 */
export function OrderConfirmationEmail({
  name = "there",
  orderNumber,
  items = [],
  subtotal,
  shippingFee,
  tax,
  total,
  orderUrl,
  demo = false,
}) {
  return (
    <Html>
      <Head />
      <Preview>{`Order ${orderNumber} confirmed - ShopSphere`}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Thanks for your order</Heading>
          <Text style={text}>Hi {name},</Text>
          <Text style={text}>
            {demo
              ? `Order ${orderNumber} was placed with test checkout. No real payment was taken.`
              : `We received your payment for order ${orderNumber}. We will email again when it ships.`}
          </Text>

          <Section style={box}>
            {items.map((item, i) => (
              <Text key={`${item.title}-${item.size}-${i}`} style={line}>
                {item.quantity} x {item.title}
                {item.size ? ` (${item.size})` : ""} - {formatCents(item.price * item.quantity)}
              </Text>
            ))}
            <Hr style={hr} />
            <Text style={line}>Subtotal: {formatCents(subtotal)}</Text>
            <Text style={line}>
              Shipping: {shippingFee ? formatCents(shippingFee) : "Free"}
            </Text>
            <Text style={line}>Tax: {formatCents(tax)}</Text>
            <Text style={totalLine}>Total: {formatCents(total)}</Text>
          </Section>

          <Text style={muted}>Estimated delivery: 3-6 business days.</Text>

          <Section style={btnSection}>
            <Button style={button} href={orderUrl}>
              View order
            </Button>
          </Section>
          <Hr style={hr} />
          <Text style={footer}>ShopSphere | Sneakers and streetwear</Text>
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
const box = {
  backgroundColor: "#fafafa",
  border: "1px solid #e4e4e7",
  borderRadius: "10px",
  padding: "12px 16px",
  margin: "16px 0",
};
const line = { color: "#3f3f46", fontSize: "14px", lineHeight: "22px", margin: "0" };
const totalLine = {
  color: "#18181b",
  fontSize: "15px",
  fontWeight: "600",
  lineHeight: "24px",
  margin: "4px 0 0",
};
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
const hr = { borderColor: "#e4e4e7", margin: "16px 0" };
const footer = { color: "#a1a1aa", fontSize: "12px", margin: 0 };
