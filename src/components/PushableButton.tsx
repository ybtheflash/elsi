import React from "react";
import styled from "styled-components";

const StyledWrapper = styled.div<{ $color: string; $text: string }>`
  .pushable {
    position: relative;
    background: transparent;
    padding: 0;
    border: none;
    cursor: pointer;
    outline: none;
    min-width: 120px;
    min-height: 40px;
    width: auto;
    height: auto;
    margin: 0;
    font-size: 1rem;
  }
  .shadow {
    position: absolute;
    top: 0;
    left: 0;
    height: 100%;
    width: 100%;
    background: ${({ $color }) => $color};
    border-radius: 8px;
    filter: blur(2px);
    will-change: transform;
    transform: translateY(1.5px);
    transition: transform 400ms cubic-bezier(0.3, 0.7, 0.4, 1);
  }
  .edge {
    position: absolute;
    top: 0;
    left: 0;
    height: 100%;
    width: 100%;
    border-radius: 8px;
    background: linear-gradient(
      to right,
      ${({ $color }) => $color} 0%,
      #e7d3ee 100%
    );
  }
  .front {
    display: block;
    position: relative;
    border-radius: 8px;
    background: ${({ $color }) => $color};
    padding: 10px 22px;
    color: ${({ $text }) => $text};
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 1px;
    font-size: 1rem;
    transform: translateY(-2.5px);
    transition: transform 400ms cubic-bezier(0.3, 0.7, 0.4, 1);
    box-shadow: 0 2px 8px 0 ${({ $color }) => $color}55;
  }
  .pushable:hover {
    filter: brightness(110%);
  }
  .pushable:hover .front {
    transform: translateY(-4px);
    transition: transform 180ms cubic-bezier(0.3, 0.7, 0.4, 1.5);
  }
  .pushable:active .front {
    transform: translateY(-1px);
    transition: transform 34ms;
  }
  .pushable:hover .shadow {
    transform: translateY(2.5px);
    transition: transform 180ms cubic-bezier(0.3, 0.7, 0.4, 1.5);
  }
  .pushable:active .shadow {
    transform: translateY(1px);
    transition: transform 34ms;
  }
`;

const PushableButton = ({
  children,
  onClick,
  color = "#c8a2c8",
  text = "#010232",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  color?: string;
  text?: string;
}) => (
  <StyledWrapper $color={color} $text={text}>
    <button className="pushable" onClick={onClick}>
      <span className="shadow" />
      <span className="edge" />
      <span className="front">{children}</span>
    </button>
  </StyledWrapper>
);

export default PushableButton;
