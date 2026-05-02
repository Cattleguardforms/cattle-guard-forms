import { redirect } from "next/navigation";

export default function DistributorStripeRedirectPage() {
  redirect("/distributor/home");
}
