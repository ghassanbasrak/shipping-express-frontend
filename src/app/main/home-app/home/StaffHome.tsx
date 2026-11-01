import { useTranslation } from "react-i18next";
import { useAppSelector } from "app/store/hooks";
import { selectUser } from "src/app/auth/user/store/userSlice";
import {
  hasOperationPermission,
  hasPagePermission,
} from "src/app/auth/permissions";
import {
  OverviewShell,
  OverviewHeader,
  OverviewSection,
  OverviewFooter,
  QuickAction,
  OverviewEmpty,
} from "app/shared-components/overview/Overview";
import { staffWorkspaceLinks } from "../Utils";
export default function StaffHome() {
  const { t } = useTranslation("homeApp"),
    user = useAppSelector(selectUser),
    links = staffWorkspaceLinks.filter(
      (link) =>
        hasOperationPermission(link.feature, "view", user) &&
        hasPagePermission(link.path, user),
    );
  return (
    <OverviewShell>
      <div data-testid="staff-home">
        <OverviewHeader
          eyebrow={t("STAFF_WORKSPACE")}
          title={t("HELLO", { name: user.firstName || t("THERE") })}
          description={t("STAFF_INTRO")}
        >
          <span className="ov-role">
            {t(user.role === "admin" ? "ADMINISTRATOR" : "TEAM_MEMBER")}
          </span>
        </OverviewHeader>
      </div>
      <OverviewSection
        title={t("YOUR_WORKSPACE")}
        subtitle={t("PERMISSION_HINT")}
      >
        <div className="ov-quick-grid">
          {links.map((link) => (
            <QuickAction
              key={link.path}
              to={link.path}
              title={t(link.title)}
              description={t(link.description)}
              icon={link.icon}
            />
          ))}
        </div>
        {!links.length && (
          <OverviewEmpty>{t("NO_WORKSPACE_ACCESS")}</OverviewEmpty>
        )}
      </OverviewSection>
      <OverviewFooter />
    </OverviewShell>
  );
}
