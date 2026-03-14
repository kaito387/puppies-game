import { useGameStore } from '../store/gameStore';
import { BUILDINGS } from '../engine/types';

export function BuildingPanel() {
  const gameState = useGameStore((store) => store.gameState);
  const buildBuilding = useGameStore((store) => store.buildBuilding);
  const clickResource = useGameStore((store) => store.clickResource);
  
  return (
    <div style={{
      padding: '16px',
      border: '1px solid #ccc',
      borderRadius: '8px',
      marginBottom: '16px',
      backgroundColor: '#f9f9f9',
    }}>
      <h3>🏡 小镇</h3>

      <button
        onClick={() => clickResource('bones')}
      >
        🦴 挖掘骨头
      </button>

      {BUILDINGS.map((building) => {
        const count = gameState.buildings[building.id] || 0;
        
        let canBuild = true;
        for (const [resourceId, cost] of Object.entries(building.cost)) {
          if ((gameState.resourceCounts[resourceId] || 0) < cost) {
            canBuild = false;
            break;
          }
        }
        
        const costText = Object.entries(building.cost)
          .map(([resourceId, cost]) => `${cost} ${resourceId}`)
          .join(' + ');
        
        return (
          <div key={building.id} style={{ margin: '12px 0' }}>
            <button
              onClick={() => buildBuilding(building.id)}
              disabled={!canBuild}
              style={{
                padding: '10px 16px',
                fontSize: '16px',
                cursor: canBuild ? 'pointer' : 'not-allowed',
                opacity: canBuild ? 1 : 0.5,
              }}
            >
              {building.icon} {building.name} (花费: {costText})
            </button>
            <span style={{ marginLeft: '8px' }}>
              已有: <strong>{count}</strong>
            </span>
          </div>
        );
      })}
    </div>
  );
}