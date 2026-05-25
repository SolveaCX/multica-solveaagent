import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { I18nProvider } from "@multica/core/i18n/react";
import enCommon from "../../locales/en/common.json";
import enRuntimes from "../../locales/en/runtimes.json";
import { ConnectRemoteDialog } from "./connect-remote-dialog";

const TEST_RESOURCES = { en: { common: enCommon, runtimes: enRuntimes } };

vi.mock("@multica/core/hooks", () => ({
  useWorkspaceId: () => "ws-1",
}));

vi.mock("@multica/core/paths", () => ({
  paths: { workspace: () => ({ agents: () => "/acme/agents", runtimeDetail: () => "/acme/runtimes/rt-1" }) },
  useWorkspaceSlug: () => "acme",
}));

vi.mock("@multica/core/realtime", () => ({
  useWSEvent: vi.fn(),
}));

vi.mock("../../navigation", () => ({
  useNavigation: () => ({ push: vi.fn() }),
}));

function renderDialog() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <I18nProvider locale="en" resources={TEST_RESOURCES}>
      <QueryClientProvider client={qc}>
        <ConnectRemoteDialog onClose={vi.fn()} />
      </QueryClientProvider>
    </I18nProvider>,
  );
}

describe("ConnectRemoteDialog", () => {
  it("shows the production server URLs in the runtime binding command", () => {
    renderDialog();

    expect(screen.getByText(/multica config set server_url https:\/\/multica-ai\.shulex\.com/)).toBeInTheDocument();
    expect(screen.getByText(/multica config set app_url https:\/\/multica-ai\.shulex\.com/)).toBeInTheDocument();
  });
});
