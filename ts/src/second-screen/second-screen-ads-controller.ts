import { HighImpactAdsController } from '../shared/components/ads/HighImpactAdsController';
import { IAdsController } from '../shared/components/ads/IAdsController';

export const secondScreenAdsController:IAdsController = new HighImpactAdsController(
  {
    smallContainerId: 'ad-runner-small',
    largeContainerId: 'ad-runner',
    size: { width: 400, height: 600 },
    instanceKey: 'OwAdDesktopInstance',
  }
);
