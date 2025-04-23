import styled, { createGlobalStyle } from 'styled-components';

export const MapContainer = styled.div`
  height: 100vh;
  display: flex;
  flex-direction: column;
`;

export const TopBar = styled.div`
  background: white;
  padding: 12px 24px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  z-index: 500;
  display: flex;
  align-items: center;
`;

export const ContentWrapper = styled.div`
  flex: 1;
  display: flex;
  position: relative;
`;

export const JobsList = styled.div`
  position: absolute;
  left: ${props => props.visible ? '0' : '-400px'};
  top: 0;
  width: 400px;
  height: 100%;
  background: white;
  box-shadow: 2px 0 8px rgba(0,0,0,0.1);
  transition: left 0.3s ease;
  z-index: 900;
  overflow-y: auto;
  padding: 20px;

  > div {
    padding: 12px;
    border-bottom: 1px solid #f0f0f0;
    cursor: pointer;
    transition: background-color 0.2s ease;

    &:hover {
      background-color: #f5f5f5;
    }
  }
`;

export const MapDiv = styled.div`
  flex: 1;
  width: 100%;
`;

export const Legend = styled.div`
  position: fixed;
  bottom: 50px;
  right: 10px;
  background: white;
  padding: 10px;
  border-radius: 4px;
  box-shadow: 0 2px 6px rgba(0,0,0,0.3);
  font-size: 12px;
  max-height: 300px;
  overflow-y: auto;
  z-index: 800;
`;

export const LegendRow = styled.div`
  margin-bottom: 5px;
  cursor: pointer;
  padding: 3px;
  border-radius: 3px;
  background-color: ${props => props.active ? 'rgba(0,0,0,0.1)' : 'transparent'};
`;

export const MarkerLabel = styled.div`
  background: white;
  padding: 2px 6px;
  border-radius: 4px;
  z-index: 10 !important;
  border: 1px solid rgba(0, 0, 0, 0.2);
  font-size: 12px;
  font-weight: bold;
  color: red;
  white-space: nowrap;
  transform: translate(-50%, -130%);
  display: inline-block;
  box-sizing: border-box;
  line-height: 1.2;
`;

export const MapStyles = createGlobalStyle`
  .marker-label {
    background: white !important;
    z-index: 1000 !important;
    padding: 2px 6px !important;
    border-radius: 4px !important;
    border: 1px solid rgba(0, 0, 0, 0.2) !important;
    transform: translateY(-25px) !important;
    white-space: nowrap !important;
    font-size: 12px !important;
    font-weight: bold !important;
  }
`;