import React, {useEffect, useState} from 'react';
import {Input, Tree, TreeDataNode} from 'antd';
import {useFolderContext} from '../context/FolderContext';
import {TokenCountDisplay} from "./TokenCountDisplay";
import union from 'lodash/union';

const {Search} = Input;

export const FolderTree: React.FC = () => {
    const {
        folders,
        treeData,
        checkedKeys,
        setCheckedKeys
    } = useFolderContext();

    const [filteredTreeData, setFilteredTreeData] = useState<TreeDataNode[]>([]);
    const [expandedKeys, setExpandedKeys] = useState<React.Key[]>([]);
    const [searchValue, setSearchValue] = useState('');
    const [autoExpandParent, setAutoExpandParent] = useState(true);

    useEffect(() => {
        if (searchValue) {
            const {filteredData, expandedKeys} = filterTreeData(treeData, searchValue);
            setFilteredTreeData(filteredData);
            setExpandedKeys(expandedKeys);
        } else {
            setFilteredTreeData(treeData);
            setExpandedKeys([]);
        }
    }, [searchValue, treeData]);

    const filterTreeData = (data: TreeDataNode[], searchValue: string): {
        filteredData: TreeDataNode[],
        expandedKeys: React.Key[]
    } => {
        const expandedKeys: React.Key[] = [];

        const filter = (node: TreeDataNode): TreeDataNode | null => {
            const nodeTitle = node.title as string;
            if (nodeTitle.toLowerCase().includes(searchValue.toLowerCase())) {
                expandedKeys.push(node.key);
                return node;
            }

            if (node.children) {
                const filteredChildren = node.children
                    .map(child => filter(child))
                    .filter((child): child is TreeDataNode => child !== null);

                if (filteredChildren.length > 0) {
                    expandedKeys.push(node.key);
                    return {...node, children: filteredChildren};
                }
            }
            return null;
        };

        const filteredData = data.map(node => filter(node)).filter((node): node is TreeDataNode => node !== null);

        return {filteredData, expandedKeys};
    };

    const onExpand = (newExpandedKeys: React.Key[]) => {
        setExpandedKeys(newExpandedKeys);
        setAutoExpandParent(false);
    };

    const onCheck = React.useCallback(
        (checkedKeysValue, e) => {
            const getAllChildKeys = (node: TreeDataNode): string[] => {
                let keys: string[] = [node.key as string];
                if (node.children) {
                    node.children.forEach(child => {
                        keys = keys.concat(getAllChildKeys(child));
                    });
                }
                return keys;
            };

            if (e.checked) {
                if (e.node.children?.length) {
                    const keysToAdd = getAllChildKeys(e.node);
                    setCheckedKeys(prevKeys =>
                        union(prevKeys as string[], keysToAdd)
                    );
                } else {
                    setCheckedKeys(prevKeys =>
                        union(prevKeys as string[], [e.node.key as string])
                    );
                }
            } else {
                if (e.node.children?.length) {
                    const keysToRemove = getAllChildKeys(e.node);
                    setCheckedKeys(prevKeys =>
                        (prevKeys as string[]).filter(key => !keysToRemove.includes(key))
                    );
                } else {
                    setCheckedKeys(prevKeys =>
                        (prevKeys as string[]).filter(key => key !== e.node.key)
                    );
                }
            }
        },
        [searchValue]
    );

    const getParentKey = (key: React.Key, tree: TreeDataNode[]): React.Key => {
        let parentKey: React.Key;
        for (let i = 0; i < tree.length; i++) {
            const node = tree[i];
            if (node.children) {
                if (node.children.some((item) => item.key === key)) {
                    parentKey = node.key;
                } else if (getParentKey(key, node.children)) {
                    parentKey = getParentKey(key, node.children);
                }
            }
        }
        return parentKey!;
    };

    const onSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setSearchValue(value);
        setAutoExpandParent(true);
    };

    return (
        <div className="folder-tree-panel">
            <TokenCountDisplay/>
            <Search style={{marginBottom: 8}} placeholder="Search folders" onChange={onSearch}/>
            {folders ? (<Tree
                    checkable
                    onExpand={onExpand}
                    expandedKeys={expandedKeys}
                    autoExpandParent={autoExpandParent}
                    onCheck={onCheck}
                    checkedKeys={checkedKeys}
                    treeData={filteredTreeData}
                />
            ) : (<div>Loading Folders...</div>)}
        </div>
    );
};