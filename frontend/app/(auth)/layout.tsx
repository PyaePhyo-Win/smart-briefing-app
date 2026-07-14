import { AuthLayout } from "../../components/AuthLayout";
import { AuthSuccessTransitionProvider } from "../../components/AuthSuccessTransitionProvider";

type LayoutProps = {
  children: React.ReactNode;
};

export default function Layout({ children }: LayoutProps) {
  return (
    <AuthSuccessTransitionProvider>
      <AuthLayout>{children}</AuthLayout>
    </AuthSuccessTransitionProvider>
  );
}
