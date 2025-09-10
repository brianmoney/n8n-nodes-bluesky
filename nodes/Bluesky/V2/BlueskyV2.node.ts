import type {
	INodeExecutionData,
	IExecuteFunctions,
	INodeType,
	INodeTypeDescription,
	INodeTypeBaseDescription,
} from 'n8n-workflow';

import { NodeConnectionType, NodeOperationError } from 'n8n-workflow';

import { AtpAgent, CredentialSession } from '@atproto/api';

// Deprecated: legacy implementation file left intentionally empty to avoid auto-registration.
export const __deprecated_BlueskyV2_node = true;
					const didMute = this.getNodeParameter('did', i) as string;
					const muteData = await muteOperation(agent, didMute);
					returnData.push(...muteData);
					break;

				case 'unmute':
					const didUnmute = this.getNodeParameter('did', i) as string;
					const unmuteData = await unmuteOperation(agent, didUnmute);
					returnData.push(...unmuteData);
					break;

				case 'block':
					const didBlock = this.getNodeParameter('did', i) as string;
					const blockData = await blockOperation(agent, didBlock);
					returnData.push(...blockData);
					break;

				case 'unblock':
					const uriUnblock = this.getNodeParameter('uri', i) as string;
					const unblockData = await unblockOperation(agent, uriUnblock);
					returnData.push(...unblockData);
					break;

				/**
				 * List operations
				 */

				case 'createList':
					const createName = this.getNodeParameter('name', i) as string;
					const createPurpose = this.getNodeParameter('purpose', i) as string;
					const createDescription = this.getNodeParameter('description', i, '') as string;
					const createListData = await createListOperation(agent, createName, createPurpose, createDescription);
					returnData.push(...createListData);
					break;

				case 'updateList':
					const updateListUri = this.getNodeParameter('listUri', i) as string;
					const updateName = this.getNodeParameter('name', i) as string;
					const updatePurpose = this.getNodeParameter('purpose', i) as string;
					const updateDescription = this.getNodeParameter('description', i, '') as string;
					const updateListData = await updateListOperation(agent, updateListUri, updateName, updatePurpose, updateDescription);
					returnData.push(...updateListData);
					break;

				case 'deleteList':
					const deleteListUri = this.getNodeParameter('listUri', i) as string;
					const deleteListData = await deleteListOperation(agent, deleteListUri);
					returnData.push(...deleteListData);
					break;

				case 'getLists':
					const listsActor = this.getNodeParameter('actor', i) as string;
					const listsLimit = this.getNodeParameter('limit', i, 50) as number;
					const getListsData = await getListsOperation(agent, listsActor, listsLimit);
					returnData.push(...getListsData);
					break;

				case 'getListFeed':
					const feedListUri = this.getNodeParameter('listUri', i) as string;
					const feedLimit = this.getNodeParameter('limit', i, 50) as number;
					const getListFeedData = await getListFeedOperation(agent, feedListUri, feedLimit);
					returnData.push(...getListFeedData);
					break;

				case 'addUserToList':
					const addListUri = this.getNodeParameter('listUri', i) as string;
					const addUserDid = this.getNodeParameter('userDid', i) as string;
					const addUserData = await addUserToListOperation(agent, addListUri, addUserDid);
					returnData.push(...addUserData);
					break;

				case 'removeUserFromList':
					const removeListItemUri = this.getNodeParameter('listItemUri', i) as string;
					const removeUserData = await removeUserFromListOperation(agent, removeListItemUri);
					returnData.push(...removeUserData);
					break;

				default:
					throw new NodeOperationError(
						this.getNode(),
						`The operation "${operation}" is not supported for resource "${resource}"!`
					);
				}
				continue; // Skip the rest of the loop for these resource operations
			}

			// If we reach here, the resource is not supported for the current item
			throw new NodeOperationError(
				this.getNode(),
				`The resource "${resource}" is not supported!`,
				{ itemIndex: i },
			);
		}

		return this.prepareOutputData(returnData);
	}
}
