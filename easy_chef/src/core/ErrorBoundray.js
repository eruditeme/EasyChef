import React from "react";

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = {hasError: false};
    }

    componentDidCatch(error, info) {
        // Display fallback UI
        this.setState({hasError: true});    // You can also log the error to an error reporting service
    }

    render() {
        return this.props.children;
    }
}
    
export default ErrorBoundary