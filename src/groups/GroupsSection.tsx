import React, { useContext, useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { HttpClientContext } from "../http-service/HttpClientContext";
import { GroupsList } from "./GroupsList";
import { GroupsCreateModal } from "./GroupsCreateModal";
import { DataLoader } from "../components/data-loader/DataLoader";
import { GroupRepresentation } from "./models/groups";
import {
  ServerGroupsArrayRepresentation,
  ServerGroupMembersRepresentation,
} from "./models/server-info";
import { TableToolbar } from "../components/table-toolbar/TableToolbar";
import { ViewHeader } from "../components/view-header/ViewHeader";
import {
  Button,
  Divider,
  Dropdown,
  DropdownItem,
  KebabToggle,
  PageSection,
  PageSectionVariants,
  Title,
  TitleSizes,
  ToolbarItem,
} from "@patternfly/react-core";
import "./GroupsSection.css";

export const GroupsSection = () => {
  const { t } = useTranslation("groups");
  const httpClient = useContext(HttpClientContext)!;
  const [rawData, setRawData] = useState([{}]);
  const [filteredData, setFilteredData] = useState([{}]);
  const [max, setMax] = useState(10);
  const [first, setFirst] = useState(0);
  const [isKebabOpen, setIsKebabOpen] = useState(false);
  const [createGroupName, setCreateGroupName] = useState("");
  const columnID: keyof GroupRepresentation = "id";
  const membersLength: keyof GroupRepresentation = "membersLength";
  const columnGroupName: keyof GroupRepresentation = "name";

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const handleModalToggle = () => {
    setIsCreateModalOpen(!isCreateModalOpen)
  };

  const loader = async () => {
    const groups = await httpClient.doGet<ServerGroupsArrayRepresentation[]>(
      "/admin/realms/master/groups",
      { params: { first, max } }
    );
    const groupsData = groups.data!;

    const getMembers = async (id: number) => {
      const response = await httpClient.doGet<
        ServerGroupMembersRepresentation[]
      >(`/admin/realms/master/groups/${id}/members`);
      const responseData = response.data!;
      return responseData.length;
    };

    const memberPromises = groupsData.map((group: { [key: string]: any }) =>
      getMembers(group[columnID])
    );
    const memberData = await Promise.all(memberPromises);
    const updatedObject = groupsData.map(
      (group: { [key: string]: any }, i: number) => {
        const object = Object.assign({}, group);
        object[membersLength] = memberData[i];
        return object;
      }
    );
    return updatedObject;
  };

  useEffect(() => {
    loader().then((data: GroupRepresentation[]) => {
      data && setRawData(data);
      setFilteredData(data);
    });
  }, [createGroupName]);

  // Filter groups
  const filterGroups = (newInput: string) => {
    const localRowData: object[] = [];
    rawData.forEach(function (obj: { [key: string]: string }) {
      const groupName = obj[columnGroupName];
      if (groupName.toLowerCase().includes(newInput.toLowerCase())) {
        localRowData.push(obj);
      }
    });
    setFilteredData(localRowData);
  };

  // Kebab delete action
  const onKebabToggle = (isOpen: boolean) => {
    setIsKebabOpen(isOpen);
  };

  const onKebabSelect = () => {
    setIsKebabOpen(!isKebabOpen);
  };

  return (
    <React.Fragment>
      <ViewHeader
        titleKey="groups:groups"
        subKey="groups:groupsDescription"
      />
      <PageSection variant={PageSectionVariants.light}>
        <TableToolbar
          count={10}
          first={first}
          max={max}
          onNextClick={setFirst}
          onPreviousClick={setFirst}
          onPerPageSelect={(f, m) => {
            setFirst(f);
            setMax(m);
          }}
          inputGroupName="groupsToolbarTextInput"
          inputGroupPlaceholder="Search groups"
          inputGroupOnChange={filterGroups}
          toolbarItem={
            <>
              <ToolbarItem>
                <Button variant="primary" onClick={() => handleModalToggle()}>
                  {t("createGroup")}
                </Button>
              </ToolbarItem>
              <ToolbarItem>
                <Dropdown
                  onSelect={onKebabSelect}
                  toggle={<KebabToggle onToggle={onKebabToggle} />}
                  isOpen={isKebabOpen}
                  isPlain
                  dropdownItems={[
                    <DropdownItem key="action" component="button">
                      {t("delete")}
                    </DropdownItem>,
                  ]}
                />
              </ToolbarItem>
            </>
          }
        >
          {rawData && filteredData && (
            <GroupsList list={filteredData ? filteredData : rawData} />
          )}
        </TableToolbar>
        <GroupsCreateModal
          isCreateModalOpen={isCreateModalOpen}
          handleModalToggle={handleModalToggle}
          setIsCreateModalOpen={setIsCreateModalOpen}
          createGroupName={createGroupName}
          setCreateGroupName={setCreateGroupName}
        />
      </PageSection>
    </React.Fragment>
  );
};
