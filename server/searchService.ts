interface SearchResult {
  title: string;
  link: string;
  snippet: string;
  displayLink?: string;
  position?: number;
}

interface SearchResponse {
  results: SearchResult[];
  searchInformation?: {
    totalResults: string;
    searchTime: number;
  };
}

export class SearchService {
  private static readonly SERPAPI_BASE_URL = 'https://serpapi.com/search';
  
  static async searchGoogle(query: string): Promise<SearchResponse> {
    const apiKey = process.env.SERPAPI_API_KEY;
    
    if (!apiKey) {
      throw new Error('SERPAPI_API_KEY not configured');
    }

    try {
      const params = new URLSearchParams({
        engine: 'google',
        q: query,
        api_key: apiKey,
        num: '10',
        hl: 'zh-cn',
        gl: 'cn'
      });

      const response = await fetch(`${this.SERPAPI_BASE_URL}?${params}`);
      
      if (!response.ok) {
        throw new Error(`Search API error: ${response.status}`);
      }

      const data = await response.json();
      
      return {
        results: (data.organic_results || []).map((result: any, index: number) => ({
          title: result.title || '',
          link: result.link || '',
          snippet: result.snippet || '',
          displayLink: result.displayed_link || result.link,
          position: index + 1
        })),
        searchInformation: {
          totalResults: data.search_information?.total_results || '0',
          searchTime: data.search_information?.time_taken_displayed || 0
        }
      };
    } catch (error) {
      console.error('Google search error:', error);
      throw new Error('Google search failed');
    }
  }

  static async searchBing(query: string): Promise<SearchResponse> {
    const apiKey = process.env.SERPAPI_API_KEY;
    
    if (!apiKey) {
      throw new Error('SERPAPI_API_KEY not configured');
    }

    try {
      const params = new URLSearchParams({
        engine: 'bing',
        q: query,
        api_key: apiKey,
        count: '10'
      });

      const response = await fetch(`${this.SERPAPI_BASE_URL}?${params}`);
      
      if (!response.ok) {
        throw new Error(`Bing search API error: ${response.status}`);
      }

      const data = await response.json();
      
      return {
        results: (data.organic_results || []).map((result: any, index: number) => ({
          title: result.title || '',
          link: result.link || '',
          snippet: result.snippet || '',
          displayLink: result.displayed_link || result.link,
          position: index + 1
        })),
        searchInformation: {
          totalResults: data.search_information?.total_results || '0',
          searchTime: data.search_information?.time_taken_displayed || 0
        }
      };
    } catch (error) {
      console.error('Bing search error:', error);
      throw new Error('Bing search failed');
    }
  }

  static async searchBaidu(query: string): Promise<SearchResponse> {
    const apiKey = process.env.SERPAPI_API_KEY;
    
    if (!apiKey) {
      throw new Error('SERPAPI_API_KEY not configured');
    }

    try {
      const params = new URLSearchParams({
        engine: 'baidu',
        q: query,
        api_key: apiKey
      });

      const response = await fetch(`${this.SERPAPI_BASE_URL}?${params}`);
      
      if (!response.ok) {
        throw new Error(`Baidu search API error: ${response.status}`);
      }

      const data = await response.json();
      
      return {
        results: (data.organic_results || []).map((result: any, index: number) => ({
          title: result.title || '',
          link: result.link || '',
          snippet: result.snippet || '',
          displayLink: result.displayed_link || result.link,
          position: index + 1
        })),
        searchInformation: {
          totalResults: data.search_information?.total_results || '0',
          searchTime: data.search_information?.time_taken_displayed || 0
        }
      };
    } catch (error) {
      console.error('Baidu search error:', error);
      throw new Error('Baidu search failed');
    }
  }

  static async multiEngineSearch(query: string, engines: string[] = ['google']): Promise<SearchResponse> {
    const results: SearchResult[] = [];
    let searchInfo = { totalResults: '0', searchTime: 0 };

    for (const engine of engines) {
      try {
        let engineResults: SearchResponse;
        
        switch (engine.toLowerCase()) {
          case 'google':
            engineResults = await this.searchGoogle(query);
            break;
          case 'bing':
            engineResults = await this.searchBing(query);
            break;
          case 'baidu':
            engineResults = await this.searchBaidu(query);
            break;
          default:
            console.warn(`Unsupported search engine: ${engine}`);
            continue;
        }

        results.push(...engineResults.results);
        
        if (engineResults.searchInformation) {
          searchInfo = engineResults.searchInformation;
        }
        
        // For demo purposes, use first successful engine
        break;
        
      } catch (error) {
        console.error(`Error searching with ${engine}:`, error);
        continue;
      }
    }

    if (results.length === 0) {
      throw new Error('All search engines failed');
    }

    return {
      results: results.slice(0, 10), // Limit to top 10 results
      searchInformation: searchInfo
    };
  }

  static async searchWithFallback(query: string): Promise<SearchResponse> {
    const engines = ['google', 'bing', 'baidu'];
    
    for (const engine of engines) {
      try {
        return await this.multiEngineSearch(query, [engine]);
      } catch (error) {
        console.error(`${engine} search failed:`, error);
        continue;
      }
    }
    
    throw new Error('当前无法联网搜索，请稍后再试');
  }
}

export default SearchService;