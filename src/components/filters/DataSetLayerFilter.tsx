import {
    Button,
    Checkbox,
    CircularProgress,
    Drawer,
    DrawerBody,
    DrawerCloseButton,
    DrawerContent,
    DrawerHeader,
    DrawerOverlay,
    List,
    ListItem,
    Modal,
    ModalBody,
    ModalContent,
    ModalOverlay,
    Spacer,
    Stack,
    Text,
    useDisclosure,
} from "@chakra-ui/react";
import { useDataEngine } from "@dhis2/app-runtime";
import { DatePicker, Input, TreeSelect } from "antd";
import { useStore } from "effector-react";
import { flatten } from "lodash";
import { ChangeEvent, useRef, useState } from "react";
import { MdFileDownload, MdFilterList } from "react-icons/md";
import {
    addRemoveColumn,
    changeCode,
    changePeriod,
    setSelectedOrgUnits,
    setUserOrgUnits,
    toggleColumns,
} from "../../store/Events";
import { api, URL } from "../../store/Queries";
import { $isChecked, $store } from "../../store/Stores";

const createQuery = (parent: any) => {
    return {
        organisations: {
            resource: `organisationUnits.json`,
            params: {
                filter: `id:in:[${parent.id}]`,
                paging: "false",
                order: "shortName:desc",
                fields: "children[id,name,path,leaf]",
            },
        },
    };
};

const DataSetLayerFilter = () => {
    const { isOpen, onOpen, onClose } = useDisclosure();
    const [code, setCode] = useState<string>("");
    const {
        isOpen: modalIsOpen,
        onOpen: modalOnOpen,
        onClose: modalOnClose,
    } = useDisclosure();
    const store = useStore($store);
    const btnRef = useRef<any>();
    const engine = useDataEngine();
    const isChecked = useStore($isChecked);
    const loadOrganisationUnitsChildren = async (parent: any) => {
        try {
            const {
                organisations: { organisationUnits },
            }: any = await engine.query(createQuery(parent));
            const found = organisationUnits.map((unit: any) => {
                return unit.children
                    .map((child: any) => {
                        return {
                            id: child.id,
                            pId: parent.id,
                            value: child.id,
                            title: child.name,
                            isLeaf: child.leaf,
                        };
                    })
                    .sort((a: any, b: any) => {
                        if (a.title > b.title) {
                            return 1;
                        }
                        if (a.title < b.title) {
                            return -1;
                        }
                        return 0;
                    });
            });
            const all = flatten(found);
            setUserOrgUnits([...store.userOrgUnits, ...all]);
        } catch (e) {
            console.log(e);
        }
    };

    const download = async () => {
        await api.get("download", {
            params: {
                code: store.code,
                selectedOrgUnits: store.selectedOrgUnits.join(","),
                period: store.period.format("YYYY[Q]Q"),
            },
        });

        const tempLink = document.createElement("a");
        tempLink.href = `${URL}/static/layering.xlsx`;
        tempLink.setAttribute("download", `layering.xlsx`);
        document.body.appendChild(tempLink);
        tempLink.click();
        document.body.removeChild(tempLink);
        modalOnClose();
    };

    return (
        <Stack direction="row" spacing="30px">
            <Stack direction="row" alignItems="center">
                <Text>Select Organisation:</Text>
                <TreeSelect
                    allowClear={true}
                    treeDataSimpleMode
                    style={{
                        width: "350px",
                    }}
                    // listHeight={700}
                    multiple
                    value={store.selectedOrgUnits}
                    dropdownStyle={{ height: 200, overflow: "scroll" }}
                    placeholder="Please select Organisation Unit(s)"
                    onChange={(value) => setSelectedOrgUnits(value)}
                    loadData={loadOrganisationUnitsChildren}
                    treeData={store.userOrgUnits}
                />
            </Stack>
            <Stack direction="row" alignItems="center">
                <Text>Quarter:</Text>
                <DatePicker
                    picker="quarter"
                    value={store.period}
                    onChange={(value) => changePeriod(value)}
                />
            </Stack>
            <Stack direction="row" alignItems="center">
                <Text>Code:</Text>
                <Input
                    value={code}
                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                        setCode(e.target.value)
                    }
                />
            </Stack>
            <Button onClick={() => changeCode(code)}>Search</Button>
            <Spacer />
            <Stack direction="row" spacing={4}>
                <Button
                    leftIcon={<MdFilterList />}
                    colorScheme="blue"
                    size="sm"
                    onClick={onOpen}
                >
                    Show columns
                </Button>
                <Button
                    rightIcon={<MdFileDownload />}
                    colorScheme="blue"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                        modalOnOpen();
                        download();
                    }}
                >
                    Download
                </Button>

                <Modal isOpen={modalIsOpen} onClose={modalOnClose} isCentered>
                    <ModalOverlay />
                    <ModalContent bg="none" boxShadow="none" textColor="white">
                        <ModalBody
                            display="flex"
                            alignItems="center"
                            alignContent="center"
                            justifyItems="center"
                            justifyContent="center"
                            boxShadow="none"
                            flexDirection="column"
                        >
                            <CircularProgress isIndeterminate />
                            <Text>Downloading please wait...</Text>
                        </ModalBody>
                    </ModalContent>
                </Modal>
                <Drawer
                    size="sm"
                    isOpen={isOpen}
                    placement="right"
                    onClose={onClose}
                    finalFocusRef={btnRef}
                >
                    <DrawerOverlay />
                    <DrawerContent>
                        <DrawerCloseButton />
                        <DrawerHeader>
                            <Checkbox
                                isChecked={isChecked}
                                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                                    toggleColumns(e.target.checked)
                                }
                            >
                                Choose Columns
                            </Checkbox>
                        </DrawerHeader>

                        <DrawerBody>
                            <List spacing={3}>
                                {store.columns.map((c) => (
                                    <ListItem key={c.display}>
                                        <Checkbox
                                            isChecked={c.selected}
                                            onChange={(
                                                e: ChangeEvent<HTMLInputElement>
                                            ) =>
                                                addRemoveColumn({
                                                    value: e.target.checked,
                                                    id: c.id,
                                                })
                                            }
                                        >
                                            {c.display}
                                        </Checkbox>
                                    </ListItem>
                                ))}
                            </List>
                        </DrawerBody>
                    </DrawerContent>
                </Drawer>
            </Stack>
        </Stack>
    );
};

export default DataSetLayerFilter;
