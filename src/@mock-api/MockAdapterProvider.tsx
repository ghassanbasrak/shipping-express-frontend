import { useEffect, useRef, useState } from "react";
import axios from "axios";
import FuseSplashScreen from "@fuse/core/FuseSplashScreen";
import { useAppDispatch } from "app/store/hooks";
import apiService from "app/store/apiService";
import ExtendedMockAdapter from "./ExtendedMockAdapter";
// import { authApiMocks } from './api/auth-api';
// import { messengerApiMocks } from './api/messenger-api';
// import { financeDashboardApiMocks } from './api/dashboards/finance-api';
// import { contactsApiMocks } from './api/contacts-api';
// import { analyticsDashboardApiMocks } from './api/dashboards/analytics-api';
// import { cryptoDashboardApiMocks } from './api/dashboards/crypto-api';
// import { projectDashboardApiMocks } from './api/dashboards/project-api';
// import { iconsApiMocks } from './api/ui/icons-api';
// import { academyApiMocks } from './api/academy-api';
// import { countriesApiMocks } from './api/countries-api';
// import { eCommerceApiMocks } from './api/ecommerce-api';
// import { fileManagerApiMocks } from './api/file-manager-api';
// import { helpCenterApiMocks } from './api/help-center-api';
// import { mailBoxApiMocks } from './api/mailbox-api';
// import { notesApiMocks } from './api/notes-api';
// import { tasksApiMocks } from './api/tasks-api';
// import { profileApiMocks } from './api/profile-api';
// import { calendarApiMocks } from './api/calendar-api';

const mockAdapterOptions = {
  delayResponse: 0,
};

const baseURL = "/mock-api";

type MockAdapterProviderProps = {
  enabled?: boolean;
  children: React.ReactNode;
};
const structures = [
  {
    id: "1",
    name: {
      en: "Subject",
    },
    pluralName: {
      en: "Subjects",
    },
    createdAt: "2020-01-01T00:00:00.000Z",
    organizationId: "65a9d0b0d7c8a5f222356940",
    subjectsCount: 12,
    active: true,
  },
  {
    id: "2",
    name: {
      en: "Part",
    },
    pluralName: {
      en: "Parts",
    },
    parentId: "1",
    createdAt: "2020-01-01T00:00:00.000Z",
    organizationId: "65a9d0b0d7c8a5f222356940",
    subjectsCount: 12,
    active: true,
  },
  {
    id: "3",
    name: {
      en: "Domain",
    },
    pluralName: {
      en: "Domains",
    },
    parentId: "2",
    createdAt: "2020-01-01T00:00:00.000Z",
    organizationId: "65a9d0b0d7c8a5f222356940",
    subjectsCount: 12,
    active: true,
  },
  {
    id: "4",
    name: {
      en: "Session",
    },
    pluralName: {
      en: "Sessions",
    },
    parentId: "2",
    createdAt: "2020-01-01T00:00:00.000Z",
    organizationId: "65a9d0b0d7c8a5f222356940",
    subjectsCount: 12,
    active: true,
  },
  {
    id: "5",
    name: {
      en: "Section",
    },
    pluralName: {
      en: "Sections",
    },
    parentId: "3",
    createdAt: "2020-01-01T00:00:00.000Z",
    organizationId: "65a9d0b0d7c8a5f222356940",
    subjectsCount: 12,
    active: true,
  },
  {
    id: "6",
    name: {
      en: "Topic",
    },
    pluralName: {
      en: "Topics",
    },
    parentId: "5",
    createdAt: "2020-01-01T00:00:00.000Z",
    organizationId: "65a9d0b0d7c8a5f222356940",
    subjectsCount: 12,
    active: true,
  },
];
// const mock = new ExtendedMockAdapter(axios, mockAdapterOptions, baseURL);
const mock = new ExtendedMockAdapter(axios, {
  delayResponse: 0,
  onNoMatch: "passthrough",
});
// mock
//   .onGet(
//     "https://cpe-api-server-development-cb91202ace52.herokuapp.com/organization/v1/subject-structures"
//   )
//   .reply(() => {
//     return [
//       200,
//       {
//         results: structures,
//         total: structures.length,
//       },
//     ];
//   });

function MockAdapterProvider(props: MockAdapterProviderProps) {
  const { enabled = true, children } = props;
  const [loading, setLoading] = useState(true);
  const dispatch = useAppDispatch();
  const isInitialMount = useRef(true);
  useEffect(() => {
    const setupAllMocks = () => {
      [
        // analyticsDashboardApiMocks,
        // cryptoDashboardApiMocks,
        // financeDashboardApiMocks,
        // projectDashboardApiMocks,
        // iconsApiMocks,
        // academyApiMocks,
        // authApiMocks,
        // calendarApiMocks,
        // contactsApiMocks,
        // countriesApiMocks,
        // eCommerceApiMocks,
        // fileManagerApiMocks,
        // helpCenterApiMocks,
        // mailBoxApiMocks,
        // messengerApiMocks,
        // notesApiMocks,
        // profileApiMocks,
        // tasksApiMocks
      ].forEach((mockSetup) => {
        mockSetup(mock);
      });
    };

    if (enabled) {
      setupAllMocks();
      mock.onAny().passThrough();
    } else {
      mock.restore();
    }

    setLoading(false);

    return () => {
      if (!enabled && mock) {
        mock.restore();
      }

      setLoading(false);
    };
  }, [enabled]);

  useEffect(() => {
    if (import.meta.hot) {
      if (!isInitialMount.current) {
        dispatch(apiService.util.resetApiState());
      }

      isInitialMount.current = false;
    }
  }, [dispatch]);

  return loading ? <FuseSplashScreen /> : children;
}

export default MockAdapterProvider;
