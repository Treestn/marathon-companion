import { TradeResponse, TradeItemResponse, TradeStatus, TradeType } from '../types/TradeApiTypes';
import { TradingProfileResponse } from '../types/ProfileApiTypes';
import { Trade, TradeItem } from '../PublishedTrades';

/**
 * Maps backend TradeItemResponse to frontend TradeItem
 * Note: The backend only provides item id and count, so we use the id as the name for now
 * In the future, this could be enhanced to fetch item details from an items API
 */
const mapTradeItem = (item: TradeItemResponse): TradeItem => {
  return {
    id: item.id,
    name: item.id, // Using id as name until we have item details
    quantity: item.count,
    imageUrl: undefined // Not available from backend yet
  };
};

/**
 * Maps backend TradeStatus to frontend status
 */
const mapTradeStatus = (status: TradeStatus): 'active' | 'accepted' | 'completed' | 'cancelled' => {
  switch (status) {
    case TradeStatus.OPEN:
      return 'active';
    case TradeStatus.ACCEPTED:
      return 'accepted';
    case TradeStatus.COMPLETED:
      return 'completed';
    case TradeStatus.CANCELLED:
      return 'cancelled';
    default:
      return 'active';
  }
};

/**
 * Maps backend TradeResponse with counterparty to frontend Trade
 * Filters out non-TRADE types as per requirements
 */
export const mapTradeResponse = (
  tradeResponse: TradeResponse,
  counterparty: TradingProfileResponse
): Trade | null => {
  // Validate tradeResponse exists
  if (!tradeResponse || !tradeResponse.type) {
    return null;
  }
  
  // Only allow TRADE type for now
  if (tradeResponse.type !== TradeType.TRADE) {
    return null;
  }

  return {
    id: tradeResponse.id,
    userId: tradeResponse.ownerProfileId,
    username: counterparty.username || 'Unknown',
    rating: counterparty.rating,
    ratingCount: counterparty.ratingCount,
    itemsOffering: tradeResponse.offeredItems.map(mapTradeItem),
    itemsRequesting: tradeResponse.requestedItems.map(mapTradeItem),
    createdAt: tradeResponse.createdAt,
    status: mapTradeStatus(tradeResponse.status),
    acceptedByProfileId: tradeResponse.acceptedByProfileId
  };
};

/**
 * Maps an array of backend { trade: TradeResponse, counterparty: TradingProfileResponse } to frontend Trade array
 * Filters out null values (non-TRADE types)
 * Also handles legacy format (TradeResponse[]) for backward compatibility
 */
export const mapTradeResponses = (
  data: Array<{ trade: TradeResponse; counterparty: TradingProfileResponse }> | TradeResponse[]
): Trade[] => {
  // Handle empty or invalid data
  if (!data || !Array.isArray(data) || data.length === 0) {
    return [];
  }
  
  // Check if it's the new v2 format (array of { trade, counterparty })
  const firstItem = data[0];
  if (firstItem && typeof firstItem === 'object' && 'trade' in firstItem && 'counterparty' in firstItem) {
    return (data as Array<{ trade: TradeResponse; counterparty: TradingProfileResponse }>)
      .map((item) => {
        if (!item || !item.trade || !item.counterparty) {
          return null;
        }
        return mapTradeResponse(item.trade, item.counterparty);
      })
      .filter((trade): trade is Trade => trade !== null);
  }
  
  // Legacy format (array of TradeResponse) - create a default counterparty
  const defaultCounterparty: TradingProfileResponse = {
    id: '',
    username: 'Unknown',
    ingameName: '',
    gameId: '',
    createdAt: '',
    rating: 0,
    ratingCount: 0
  };
  
  return (data as TradeResponse[])
    .map((tradeResponse) => {
      if (!tradeResponse || typeof tradeResponse !== 'object') {
        return null;
      }
      return mapTradeResponse(tradeResponse, defaultCounterparty);
    })
    .filter((trade): trade is Trade => trade !== null);
};

